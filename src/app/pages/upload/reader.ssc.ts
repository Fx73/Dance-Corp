import { Measures, MusicDto } from "src/app/game/gameModel/music.dto";

import { ITimedChange } from 'src/app/game/gameModel/timedChange';

export class SccReader {

  static parseFile(filename: string, content: string): MusicDto {
    let tokenMap: Record<string, any>;

    if (filename.endsWith('.sm')) {
      tokenMap = this.tokenizeSM(content);
    } else if (filename.endsWith('.ssc')) {
      tokenMap = this.tokenizeSSC(content);
    } else if (filename.endsWith('.essc')) {
      tokenMap = this.tokenizeSSC(content, true);
    } else {
      throw new Error('Unsupported file format');
    }

    const musicData = new MusicDto(tokenMap);
    return musicData;
  }


  static tokenizeCommon(content: string): string[] {
    // Supprimer les commentaires de type //
    content = content.replace(/\/\/.*$/gm, '');
    // Supprimer les commentaires de type /* */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Découper le contenu en tokens avec le symbole #
    const tokens = content.split('#').map(token => token.trim()).filter(token => token.length > 0);
    return tokens;
  }

  static tokenizeSSC(content: string, isEscc: boolean = false): Record<string, any> {
    const tokens = this.tokenizeCommon(content);
    const tokenMap: Record<string, any> = {};
    let currentNoteData: Record<string, string> | null = null;
    let noteDataIndex = 0;

    tokens.forEach(token => {
      const [key, value] = token.split(/:(.+)?;/s);
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'notedata') {
        currentNoteData = {};
        noteDataIndex++;
        tokenMap[`notedata${noteDataIndex}`] = currentNoteData;
      } else if (lowerKey === 'notes' && currentNoteData) {
        let notes = isEscc ? value : SccReader.convertNotes(value);
        currentNoteData[lowerKey] = notes;
        currentNoteData = null;
      } else if (currentNoteData) {
        currentNoteData[lowerKey] = value;
      } else {
        tokenMap[lowerKey] = value;
      }
    });

    return tokenMap;
  }

  static tokenizeSM(content: string): Record<string, any> {
    const tokens = this.tokenizeCommon(content);
    const tokenMap: Record<string, any> = {};
    let noteDataIndex = 0;
    tokens.forEach(token => {
      const [key, ...rest] = token.split(":");
      const value = rest.join(":");

      const lowerKey = key.toLowerCase();

      if (lowerKey === 'notes') {
        const lines = value.split(':').map(line => line.trim());
        let currentNoteData: Record<string, string> = {};
        noteDataIndex++;
        currentNoteData['stepstype'] = lines[0];
        currentNoteData['credits'] = lines[1];
        currentNoteData['difficulty'] = lines[2];
        currentNoteData['meter'] = lines[3];
        currentNoteData['notes'] = SccReader.convertNotes(lines[5]);

        tokenMap[`notedata${noteDataIndex}`] = currentNoteData;

      } else {
        tokenMap[lowerKey] = value;
      }
    });

    return tokenMap;
  }


  /**
   * Converts special characters in the given token according to the specified rules:
   *
   * 1 - Tap note
   * 2 - Hold head
   * 3 - Hold/roll/Minefield end
   * 4 - Roll head
   * M - Mine  -> 5
   * N - Minefield head  -> 6
   * F - Fake -> 7
   * H - Hidden -> 8
   *
   * @param token - The input token containing notes
   * @return The converted token
   */
  static convertNotes(token: string): string {
    return token.split('').map(char => {
      switch (char) {
        case 'M':
          return '5';
        case 'N':
          return '6';
        case 'F':
          return '7';
        case 'H':
          return '8';
        default:
          if (/[A-Za-z]/.test(char)) {
            return '0';
          }
          return char;
      }
    }).join('');
  }

}


export class SccWriter {
  static getOrderedFields(dto: any): [string, any][] {
    return Object.keys(dto).map(key => [key, dto[key]]);
  }

  static writeSscFile(dto: MusicDto, isEssc: boolean = false): string {
    let esscContent = '';
    const fileFields = SccWriter.getOrderedFields(dto).filter(([key]) => key !== 'noteData' && key !== 'additionalFields');
    for (const [key, value] of fileFields) {
      esscContent += `#${key.toUpperCase()}:`;
      esscContent += this.writeEsscValue(value);
      esscContent += ';\n';
    }
    esscContent += '\n';

    let count = 0
    for (const noteData of dto.noteData) {
      esscContent += `//--------------- Dance ${count} / ${dto.noteData.length} ----------------\n#NOTEDATA:;\n`;
      for (const [subKey, subValue] of Object.entries(noteData).filter(([key]) => key !== 'stepChart')) {
        esscContent += `#${subKey.toUpperCase()}:`;
        esscContent += this.writeEsscValue(subValue);
        esscContent += `;\n`;
      }
      esscContent += `#NOTES:\n`;
      esscContent += noteData.stepChart.map((measure: Measures) => measure.steps.map((row: any) => row.join('')).join('\n')).join('\n,\n');
      esscContent += `\n;\n\n`;
      count++;
    }
    return esscContent
  }

  private static writeEsscValue(value: any): string {
    if (value === undefined || value === null)
      return '';
    if (Array.isArray(value) && value[0]) {
      return value.map((v: ITimedChange) => v.time.toFixed(3) + '=' + v.value).join(',');
    }

    if (value instanceof Date)
      return value.toISOString().split('T')[0];

    return value.toString();
  }
}