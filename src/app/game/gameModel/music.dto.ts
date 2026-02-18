import { BpmChange, TextChange } from "./timedChange";

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
  sampleStart?: number;
  sampleLength?: number;
  bpms: BpmChange[] = [];
  stops?: string;
  delays?: string;
  warps?: string;
  bgChanges?: TextChange[];
  labels?: TextChange[];
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
    this.sampleStart = parseFloat(tokenMap["samplestart"]);
    delete tokenMap["samplestart"];
    this.sampleLength = parseFloat(tokenMap["samplelength"]);
    delete tokenMap["samplelength"];
    this.stops = tokenMap["stops"];
    delete tokenMap["stops"];
    this.delays = tokenMap["delays"];
    delete tokenMap["delays"];
    this.warps = tokenMap["warps"];
    delete tokenMap["warps"];
    this.bpms = this.parseChanges<BpmChange>(tokenMap["bpms"], v => parseFloat(v))!;
    delete tokenMap["bpms"];
    this.bgChanges = this.parseChanges<TextChange>(tokenMap["bgchanges"], v => v);
    if (tokenMap["background"] && !this.bgChanges) {
      this.bgChanges = [new TextChange(0, tokenMap["background"])];

    }
    delete tokenMap["background"];
    delete tokenMap["bgchanges"];
    this.labels = this.parseChanges<TextChange>(tokenMap["labels"], v => v);
    delete tokenMap["labels"];

    Object.keys(tokenMap).forEach(key => {
      if (key.startsWith('notedata')) {
        this.noteData.push(new NoteDataDto(tokenMap[key]))
        delete tokenMap[key];
      }
    });
    this.noteData.sort((a, b) => (a.meter || 0) - (b.meter || 0));

    this.additionalFields = { ...tokenMap };
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
    this.chartName = tokenMap["chartname"].trim() || `${this.difficulty}_${this.meter}_${this.creationDate.toISOString().split('T')[0]}`;

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

