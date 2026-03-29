import { BackgroundChange, BpmChange, LabelChange, ScrollChange, SpeedChange, StopChange, WarpChange } from "./timeManagement/timedChange";

import { DanceType } from "../constants/dance-type.enum";
import { DifficultyCriteria } from "src/app/pages/upload/DifficultyCriteria";
import { NoteDifficulty } from "../constants/note-difficulty.enum";

export class MusicDto {
  title?: string;
  titletranslit?: string;
  subtitle?: string;
  subtitletranslit?: string;
  artist?: string;
  artisttranslit?: string;
  genre?: string;
  credit?: string;
  banner?: string;
  jacket?: string;
  cdTitle?: string;
  music?: string;
  offset: number = 0; //beat0OffsetInSeconds
  musicoffset?: number; //musicOffsetInSeconds 
  sampleStart?: number;
  sampleLength?: number;
  bpms: BpmChange[] = [];
  stops: StopChange[] = [];
  warps: WarpChange[] = [];
  speeds: SpeedChange[] = [];
  scrolls: ScrollChange[] = [];
  bgChanges: BackgroundChange[] = [];
  labels: LabelChange[] = [];
  noteData: NoteDataDto[] = [];
  additionalFields?: Record<string, string>;

  get id(): string { return `${this.artist}-${this.title}` }

  constructor(tokenMap?: Record<string, any>) {
    if (tokenMap === undefined) return

    this.title = tokenMap["title"];
    delete tokenMap["title"];
    this.titletranslit = tokenMap["titletranslit"];
    delete tokenMap["titletranslit"];
    this.subtitle = tokenMap["subtitle"];
    delete tokenMap["subtitle"];
    this.subtitletranslit = tokenMap["subtitletranslit"];
    delete tokenMap["subtitletranslit"];
    this.artist = tokenMap["artist"];
    delete tokenMap["artist"];
    this.artisttranslit = tokenMap["artisttranslit"];
    delete tokenMap["artisttranslit"];
    this.genre = tokenMap["genre"];
    delete tokenMap["genre"];
    this.credit = tokenMap["credit"];
    delete tokenMap["credit"];
    this.banner = tokenMap["banner"];
    delete tokenMap["banner"];
    this.jacket = tokenMap["jacket"];
    delete tokenMap["jacket"];
    if (this.jacket === undefined) this.jacket = tokenMap["cdimage"];
    delete tokenMap["cdimage"];
    if (this.jacket === undefined) this.jacket = tokenMap["discimage"];
    delete tokenMap["discimage"];
    this.cdTitle = tokenMap["cdtitle"];
    delete tokenMap["cdtitle"];
    this.music = tokenMap["music"];
    delete tokenMap["music"];
    this.offset = tokenMap["offset"] ? parseFloat(tokenMap["offset"]) ?? parseFloat(tokenMap["beat0OffsetInSeconds"]) : 0;
    delete tokenMap["offset"];
    delete tokenMap["beat0OffsetInSeconds"];
    this.musicoffset = tokenMap["musicoffset"] ? parseFloat(tokenMap["musicoffset"]) : undefined;
    delete tokenMap["musicoffset"];
    this.sampleStart = parseFloat(tokenMap["samplestart"]);
    delete tokenMap["samplestart"];
    this.sampleLength = parseFloat(tokenMap["samplelength"]);
    delete tokenMap["samplelength"];
    this.stops = this.parseChanges<StopChange>(tokenMap["stops"], v => parseFloat(v)) ?? [];
    delete tokenMap["stops"];
    this.warps = this.parseChanges<WarpChange>(tokenMap["warps"], v => parseFloat(v)) ?? [];
    delete tokenMap["warps"];
    this.speeds = this.parseChanges<SpeedChange>(tokenMap["speeds"], v => parseFloat(v)) ?? [];
    delete tokenMap["speeds"];
    this.scrolls = this.parseChanges<ScrollChange>(tokenMap["scrolls"], v => parseFloat(v)) ?? [];
    delete tokenMap["scrolls"];
    this.bpms = this.parseChanges<BpmChange>(tokenMap["bpms"], v => parseFloat(v))!;
    delete tokenMap["bpms"];
    this.bgChanges = this.parseChanges<BackgroundChange>(tokenMap["bgchanges"], v => v) ?? [];
    delete tokenMap["background"];
    delete tokenMap["bgchanges"];
    this.labels = this.parseChanges<LabelChange>(tokenMap["labels"], v => v) ?? [];
    delete tokenMap["labels"];

    const parsedDelays = this.parseChanges<StopChange>(tokenMap["delays"], v => parseFloat(v)) ?? [];
    delete tokenMap["delays"];

    Object.keys(tokenMap).forEach(key => {
      if (key.startsWith('notedata')) {
        this.noteData.push(new NoteDataDto(tokenMap[key]))
        delete tokenMap[key];
      }
    });
    this.noteData.sort((a, b) => (a.meter || 0) - (b.meter || 0));

    if (parsedDelays.length > 0) {
      this.stops.push(...parsedDelays);
      this.stops.sort((a, b) => a.time - b.time);
    }

    const toRemoveTokens = ['selectable', 'tickcounts']
    const leftTokens = Object.fromEntries(
      Object.entries(tokenMap).filter(([key, value]) =>
        !toRemoveTokens.includes(key) &&
        value !== null &&
        value !== undefined &&
        !(typeof value === "string" && value.trim() === "")
      )
    );
    this.additionalFields = { ...leftTokens };
  }

  private parseChanges<ITimedChange>(token: string, parsefun: (value: string) => any): ITimedChange[] | undefined {
    if (!token) return undefined;
    const changes = token.split(',');
    const array: ITimedChange[] = []
    for (const change of changes) {
      const [timeStr, valueStr] = change.split('=');
      const time = parseFloat(timeStr);
      const value = parsefun(valueStr);
      array.push({ value, time } as ITimedChange);
    }

    return array;
  }

  static fromJSON(obj: any): MusicDto {
    const instance = Object.assign(new MusicDto(), obj);
    instance.noteData = Array.isArray(obj.noteData)
      ? obj.noteData.map((n: Record<string, string> | undefined) => NoteDataDto.fromJSON(n))
      : [];
    return instance;
  }

  deepClone(): MusicDto {
    return MusicDto.fromJSON(JSON.parse(JSON.stringify(this)));
  }
}


export class NoteDataDto {
  chartName: string = "NoChartNameError";
  stepsType?: DanceType;
  description?: string;
  chartStyle?: string;
  difficulty?: NoteDifficulty;
  meter?: number;
  difficultyCriterias?: DifficultyCriteria;
  credit?: string;
  creatorId?: string;
  creationDate: Date = new Date()
  stepChart: Measures[] = [];

  constructor(tokenMap?: Record<string, string>) {
    if (tokenMap === undefined) return

    this.stepsType = tokenMap["stepstype"] as DanceType;
    this.description = tokenMap["description"];
    this.chartStyle = tokenMap["chartstyle"];
    this.difficulty = tokenMap["difficulty"] as NoteDifficulty;
    this.meter = parseInt(tokenMap["meter"]);
    this.credit = tokenMap["credit"];
    this.creatorId = tokenMap["creatorid"];
    const creationDateValue = tokenMap["creationdate"];
    this.creationDate = creationDateValue ? new Date(creationDateValue) : new Date();
    console.log("Parsed chart name:", tokenMap["chartname"]);
    this.chartName = tokenMap["chartname"]?.trim() || `${this.difficulty}_${this.meter}_${this.stepsType === DanceType.DanceSingle ? 'S' : 'D'}_${this.creationDate.toISOString().split('T')[0]}`;

    this.stepChart = tokenMap["notes"].split(',').map(measure => {
      const measureInstance = new Measures();
      measureInstance.steps = measure.trim().split('\n').map(line => line.trim().split('').map(step => parseInt(step)));
      return measureInstance;
    });
    this.difficultyCriterias = tokenMap["difficultycriterias"] ? DifficultyCriteria.ParseCriteria(tokenMap["difficultycriterias"]) : undefined;

  }

  static fromJSON(obj: any): NoteDataDto {
    const instance = Object.assign(new NoteDataDto(), obj);
    instance.stepChart = Array.isArray(obj.stepChart)
      ? obj.stepChart.map((n: Record<string, string> | undefined) => Measures.fromJSON(n))
      : [];
    return instance;
  }
}

export class Measures {
  steps: number[][] = [];

  static fromJSON(obj: any): Measures {
    const instance = Object.assign(new Measures(), obj);
    instance.steps = Array.isArray(obj.steps) ? obj.steps.map((row: any) => Array.isArray(row) ? row.map(Number) : []) : [];
    return instance;
  }
}

