export class MusicDto {
  title?: string;
  artist?: string;
  banner?: string;
  background?: string;
  cdTitle?: string;
  music?: string;
  sampleStart?: number;
  sampleLength?: number;
  bpms?: string;
  notes: Notes[] = [];
  additionalFields?: Record<string, string>;

  constructor(tokenMap: Record<string, any>) {
    this.title = tokenMap["title"];
    delete tokenMap["title"];
    this.artist = tokenMap["artist"];
    delete tokenMap["artist"];
    this.banner = tokenMap["banner"];
    delete tokenMap["banner"];
    this.background = tokenMap["background"];
    delete tokenMap["background"];
    this.cdTitle = tokenMap["cdtitle"];
    delete tokenMap["cdtitle"];
    this.music = tokenMap["music"];
    delete tokenMap["music"];
    this.sampleStart = parseFloat(tokenMap["samplestart"]);
    delete tokenMap["samplestart"];
    this.sampleLength = parseFloat(tokenMap["samplelength"]);
    delete tokenMap["samplelength"];
    this.bpms = tokenMap["bpms"];
    delete tokenMap["bpms"];

    Object.keys(tokenMap).forEach(key => {
      if (key.startsWith('notedata')) {
        this.notes.push(new Notes(tokenMap[key]))
        delete tokenMap[key];
      }
    });

    this.additionalFields = { ...tokenMap };
  }
}


export class Notes {
  chartName?: string;
  stepsType?: string;
  description?: string;
  chartStyle?: string;
  difficulty?: string;
  meter?: number;
  credit?: string;
  stepChart: Measures[] = [];

  constructor(tokenMap: Record<string, string>) {
    this.chartName = tokenMap["chartname"];
    this.stepsType = tokenMap["stepstype"];
    this.description = tokenMap["description"];
    this.chartStyle = tokenMap["chartstyle"];
    this.difficulty = tokenMap["difficulty"];
    this.meter = parseInt(tokenMap["meter"]);
    this.credit = tokenMap["credit"];

    this.stepChart = tokenMap["notes"].split(',').map(measure => {
      const measureInstance = new Measures();
      measureInstance.steps = measure.trim().split('\n').map(line => line.split('').map(step => parseInt(step)));
      return measureInstance;
    });

  }
}

export class Measures {
  steps: number[][] = [];
}
