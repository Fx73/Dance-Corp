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
  background?: string;
  jacket?: string;
  cdTitle?: string;
  music?: string;
  offset?: number;
  sampleStart?: number;
  sampleLength?: number;
  bpms: BpmChange[] = [];
  stops?: string;
  delays?: string;
  warps?: string;
  bgChanges?: string;
  notes: Notes[] = [];
  additionalFields?: Record<string, string>;

  constructor(tokenMap: Record<string, any>) {
    this.title = tokenMap["title"];
    delete tokenMap["title"];
    this.titletranslit = tokenMap["titletranslit"];
    delete tokenMap["titletranslit"];
    this.title = tokenMap["subtitle"];
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
    this.background = tokenMap["background"];
    delete tokenMap["background"];
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
    this.offset = parseFloat(tokenMap["offset"]);
    delete tokenMap["offset"];
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
    this.bgChanges = tokenMap["bgchanges"];
    delete tokenMap["bgchanges"];
    this.bpms = this.parseBpmChanges(tokenMap["bpms"]);
    delete tokenMap["bpms"];

    Object.keys(tokenMap).forEach(key => {
      if (key.startsWith('notedata')) {
        this.notes.push(new Notes(tokenMap[key]))
        delete tokenMap[key];
      }
    });
    this.notes.sort((a, b) => (a.meter || 0) - (b.meter || 0));

    this.additionalFields = { ...tokenMap };
  }


  private parseBpmChanges(bpmChanges: string): BpmChange[] {
    const changes = bpmChanges.split(',');
    return changes.map(change => {
      const [timeStr, bpmStr] = change.split('=');
      const time = parseFloat(timeStr);
      const bpm = parseFloat(bpmStr);
      return { time, bpm };
    });
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
      measureInstance.steps = measure.trim().split('\n').map(line => line.trim().split('').map(step => parseInt(step)));
      return measureInstance;
    });

  }
}

export class Measures {
  steps: number[][] = [];
}

export class BpmChange {
  time: number = 0;
  bpm: number = 120;
}