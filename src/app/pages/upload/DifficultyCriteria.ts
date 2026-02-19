import { ITimedChange } from "src/app/game/gameModel/timedChange";
import { Measures } from "src/app/game/gameModel/music.dto";

export class DifficultyCriteria {
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
        case 'e':
          criteria.endurance = numericValue;
          break;
        case 's':
          criteria.speed = numericValue;
          break;
        case 't':
          criteria.technical = numericValue;
          break;
        case 'b':
          criteria.burst = numericValue;
          break;
        case 'c':
          criteria.chaos = numericValue;
          break;
      }
    }

    return criteria;
  }
}

export class NoteEvaluator {
  bpms: ITimedChange[];
  stepChart: Measures[]
  criterias: DifficultyCriteria = new DifficultyCriteria();

  constructor(bpms: ITimedChange[], stepChart: Measures[]) {
    this.bpms = bpms;
    this.stepChart = stepChart;
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
    const TOTAL_STEPS_WEIGHT = 1;
    const DOUBLE_STEP_WEIGHT = 4;
    const CHAINED_DOUBLE_STEP_WEIGHT = 16;
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

    const criteria = totalSteps * TOTAL_STEPS_WEIGHT + doubleSteps * DOUBLE_STEP_WEIGHT + chainedDoubleSteps * CHAINED_DOUBLE_STEP_WEIGHT;
    return criteria;
  }

  evaluateSpeed(): number {
    let measureNumber = 0;
    let averageMeasure = 0;
    for (const measure of this.stepChart) {
      averageMeasure += measure.steps.length;
      measureNumber++;
    }
    averageMeasure /= measureNumber;

    const bpm: number = this.bpms[0].value as number;

    const criteria = averageMeasure * bpm;
    return criteria;
  }

  evaluateTechnical(): number {
    const STEP_WITH_HOLD_WEIGHT = 4;
    const SAME_ARROW_REPEAT_WEIGHT = 1;
    const OFF_BEAT_STEP_WEIGHT = 2;

    let stepWithHoldCount = 0;
    let sameArrowRepeatCount = 0;
    let offBeatStepCount = 0;

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
      }
    }


    const criteria = stepWithHoldCount * STEP_WITH_HOLD_WEIGHT + sameArrowRepeatCount * SAME_ARROW_REPEAT_WEIGHT + offBeatStepCount * OFF_BEAT_STEP_WEIGHT;
    return criteria;
  }

  evaluateBurst(): number {
    const BURST_WEIGHT = 2;
    const BURST_INTENSITY_WEIGHT = 1;

    let burstCount = 0;
    let burstIntensity = 0;

    let currentBurstIntensity = 0;
    const BURST_THRESHOLD = 12; // Minimum number of steps in a burst to be considered significant

    for (const measure of this.stepChart) {
      const measureLength = measure.steps.length;

      if (measureLength === 4) {
        if (currentBurstIntensity > BURST_THRESHOLD) {
          burstCount++;
          burstIntensity += currentBurstIntensity;
        }
        currentBurstIntensity = 0;
      } else {
        let currentEmptyStreak = 0;

        for (let i = 0; i < measureLength; i++) {
          const line = measure.steps[i];
          const isEmpty = line.every(v => v === 0);
          if (isEmpty) {
            currentEmptyStreak++;
          } else {
            currentBurstIntensity++;
            currentEmptyStreak = 0;
          }
          if (currentEmptyStreak >= measureLength / 8) {
            if (currentBurstIntensity > BURST_THRESHOLD) {
              burstCount++;
              burstIntensity += currentBurstIntensity;
            }
            currentBurstIntensity = 0;
          }
        }
        if (currentBurstIntensity > BURST_THRESHOLD) {
          burstCount++;
          burstIntensity += currentBurstIntensity;
        }
      }

    }

    const criteria = burstCount * BURST_WEIGHT + burstIntensity * BURST_INTENSITY_WEIGHT;
    return criteria;
  }
}