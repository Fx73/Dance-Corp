import { BpmChange, ITimedChange } from "src/app/game/gameModel/timeManagement/timedChange";

import { Measures } from "src/app/game/gameModel/music.dto";

export class DifficultyCriteria {
  [key: string]: number | any;

  endurance: number = 0;  //measures sustained effort
  speed: number = 0; //measures speed of notes
  technical: number = 0;   //measure variety of steps and patterns
  burst: number = 0;   //measure complexity in most intense sections
  chaos: number = 0;   //measures unpredictability

  toString(): string {
    return `e=${this.endurance},s=${this.speed},t=${this.technical},b=${this.burst},c=${this.chaos}`;
  }

  static ParseCriteria(criteriaString: string): DifficultyCriteria {
    const criteria = new DifficultyCriteria();
    const pairs = criteriaString.split(',');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      const numericValue = parseFloat(value);

      switch (key.trim()) {
        case 'e': criteria.endurance = numericValue; break;
        case 's': criteria.speed = numericValue; break;
        case 't': criteria.technical = numericValue; break;
        case 'b': criteria.burst = numericValue; break;
        case 'c': criteria.chaos = numericValue; break;
      }
    }

    return criteria;
  }
}

export class NoteEvaluator {
  bpms: BpmChange[];
  stepChart: Measures[]
  criterias: DifficultyCriteria = new DifficultyCriteria();

  totalSteps = 0
  doubleSteps = 0;
  chainedDoubleSteps = 0;
  avgBpm = 0;
  maxBpm = 0;
  stepWithHoldCount = 0;
  sameArrowRepeatCount = 0;
  offBeatStepCount = 0;
  tripleStepCount = 0;
  mineCount = 0;
  burstVariation = 0;

  constructor(bpms: BpmChange[], stepChart: Measures[]) {
    this.bpms = bpms;
    this.stepChart = stepChart;
  }

  public generateTsvLine(name: string, score: number): string {
    const tsvLine = [name, score, this.totalSteps, this.doubleSteps, this.chainedDoubleSteps, this.avgBpm, this.maxBpm, this.stepWithHoldCount, this.sameArrowRepeatCount, this.offBeatStepCount, this.tripleStepCount, this.mineCount, this.burstVariation].join('\t');
    return tsvLine

  }

  getLevelFromCriterias() {
    const W_ENDURANCE = 0.12
    const W_SPEED = 0.01
    const W_TECHNICAL = 0.06
    const W_BURST = 0.05

    return this.criterias.endurance * W_ENDURANCE + this.criterias.speed * W_SPEED + this.criterias.technical * W_TECHNICAL + this.criterias.burst * W_BURST
  }

  evaluateCriterias(): DifficultyCriteria {
    this.criterias = new DifficultyCriteria();
    this.criterias.endurance = this.evaluateEndurance();
    this.criterias.speed = this.evaluateSpeed();
    this.criterias.technical = this.evaluateTechnical();
    this.criterias.burst = this.evaluateBurst();
    // Chaos is not implemented yet, but can be added in the future

    return this.criterias;
  }

  evaluateEndurance(): number {
    const TOTAL_STEPS_WEIGHT = 0.2;
    const DOUBLE_STEP_WEIGHT = 0.05;
    const CHAINED_DOUBLE_STEP_WEIGHT = 0.1;
    let totalSteps = 0;
    let doubleSteps = 0;
    let chainedDoubleSteps = 0;

    let previousDoubleIndex: number | null = null;
    const MAX_DOUBLE_STEP_DISTANCE = 2; // Maximum distance between double steps to be considered chained

    for (const measure of this.stepChart) {
      for (const line of measure.steps) {
        // Action step are 1, 2 and 4
        const activeSteps = line.filter(value => value === 1 || value === 2 || value === 4);

        if (activeSteps.length >= 1)
          totalSteps++;
        if (activeSteps.length >= 2) {
          doubleSteps++;

          if (previousDoubleIndex !== null) {
            chainedDoubleSteps++;
          }

          previousDoubleIndex = 0;
        } else {
          if (previousDoubleIndex !== null) {
            previousDoubleIndex += 1;
            if (previousDoubleIndex > MAX_DOUBLE_STEP_DISTANCE) {
              previousDoubleIndex = null;
            }
          }
        }
      }
    }

    this.totalSteps = totalSteps
    this.doubleSteps = doubleSteps
    this.chainedDoubleSteps = chainedDoubleSteps

    const criteria = totalSteps * TOTAL_STEPS_WEIGHT + doubleSteps * DOUBLE_STEP_WEIGHT + chainedDoubleSteps * CHAINED_DOUBLE_STEP_WEIGHT;
    return criteria;
  }

  evaluateSpeed(): number {
    const AVG_BPM_WEIGHT = 0.8;
    const MAX_BPM_WEIGHT = 0.2;


    let bpmDurations = new Map<number, number>();

    for (let i = 0; i < this.bpms.length - 1; i++) {
      const bpm = this.bpms[i];
      const next = this.bpms[i + 1];
      const duration = (60 / bpm.value) * (next.time - bpm.time);

      bpmDurations.set(bpm.value, (bpmDurations.get(bpm.value) ?? 0) + duration);
    }

    const last = this.bpms[this.bpms.length - 1];
    const totalBeats = this.stepChart.length * 4;
    const lastDuration = (60 / last.value) * (totalBeats - last.time);

    bpmDurations.set(last.value, (bpmDurations.get(last.value) ?? 0) + lastDuration);


    let weightedSum = 0;
    let totalDuration = 0;

    for (const [bpm, duration] of bpmDurations) {
      weightedSum += bpm * duration;
      totalDuration += duration;
    }

    const avgBpm = Math.round((weightedSum / totalDuration) * 1000) / 1000;

    let maxBpm = 0;
    let maxBpmDuration = 0;

    for (const [bpm, duration] of bpmDurations) {
      if (bpm > maxBpm) {
        maxBpm = bpm;
        maxBpmDuration = duration;
      }
    }
    //Non linear weighting
    const alpha = 0.3;
    const maxWeighted = maxBpm * Math.pow(maxBpmDuration / totalDuration, alpha);

    this.avgBpm = avgBpm;
    this.maxBpm = maxWeighted;

    return AVG_BPM_WEIGHT * avgBpm + MAX_BPM_WEIGHT * maxWeighted;
  }


  evaluateTechnical(): number {
    const STEP_WITH_HOLD_WEIGHT = 0.1;
    const SAME_ARROW_REPEAT_WEIGHT = 0.001;
    const OFF_BEAT_STEP_WEIGHT = 0.1;
    const TRIPLE_STEP_WEIGHT = 5;
    const MINE_WEIGHT = 0.02;

    let stepWithHoldCount = 0;
    let sameArrowRepeatCount = 0;
    let offBeatStepCount = 0;
    let tripleStepCount = 0;
    let mineCount = 0;

    let isHolding: boolean = false;
    let previousLine: number[] = [0, 0, 0, 0];

    for (const measure of this.stepChart) {
      for (let i = 0; i < measure.steps.length; i++) {
        const line = measure.steps[i];

        //Check for step with hold
        if (line.some(v => v === 2 || v === 4)) {
          isHolding = true;
        }
        if (isHolding && line.some(v => v === 1 || v === 2 || v === 4)) {
          stepWithHoldCount++;
        }
        if (line.some(v => v === 3)) {
          isHolding = false;
        }

        //Check for same arrow repeat
        if (line.some(v => v === 1 || v === 2 || v === 4)) {
          const sameArrowCount = line.filter((v, i) => v === previousLine[i] && (v === 1 || v === 2 || v === 4)).length;
          if (sameArrowCount > 0) {
            sameArrowRepeatCount += sameArrowCount;
          }
        }
        previousLine = line;

        // Check for off-beat and off-half-beat steps
        if (line.some(v => v === 1 || v === 2 || v === 4)) {
          if (i % (measure.steps.length / 8) !== 0) {
            offBeatStepCount++;
          }
        }

        // Check for triple or quad steps
        const activeCount = line.filter(v => v === 1 || v === 2 || v === 4).length;
        if (activeCount === 3)
          tripleStepCount++;
        if (activeCount === 4)
          tripleStepCount += 4;

        mineCount += line.filter(v => v === 5).length;
      }
    }

    this.stepWithHoldCount = stepWithHoldCount;
    this.sameArrowRepeatCount = sameArrowRepeatCount;
    this.offBeatStepCount = offBeatStepCount;
    this.tripleStepCount = tripleStepCount;
    this.mineCount = mineCount;

    const criteria = stepWithHoldCount * STEP_WITH_HOLD_WEIGHT + sameArrowRepeatCount * SAME_ARROW_REPEAT_WEIGHT + offBeatStepCount * OFF_BEAT_STEP_WEIGHT + tripleStepCount * TRIPLE_STEP_WEIGHT + mineCount * MINE_WEIGHT;
    return criteria;
  }

  evaluateBurst(): number {
    const BURST_VARIATION_WEIGHT = 1;

    const intervals: number[] = [];
    let previousBeat: number = 0;

    for (let i = 0; i < this.stepChart.length; i++) {
      const measure = this.stepChart[i];
      const beatDivision = measure.steps.length / 4;

      for (let j = 0; j < measure.steps.length; j++) {
        const line = measure.steps[j];
        const hasNote = line.some(v => v === 1 || v === 2 || v === 4);

        if (hasNote) {
          if (previousBeat !== null) {
            intervals.push(previousBeat);
          }
          previousBeat = 0;
        } else {
          previousBeat += 1 / beatDivision;
        }
      }
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / intervals.length;
    const std = Math.sqrt(variance);
    const heterogeneityScore = std / mean;

    this.burstVariation = heterogeneityScore;

    const criteria = heterogeneityScore * BURST_VARIATION_WEIGHT;
    return criteria;
  }
}