import { MusicDto } from "src/app/game/gameModel/music.dto";

export class SccReader {

  static parseFile(filename: string, content: string): MusicDto {
    let tokenMap: Record<string, any>;

    if (filename.endsWith('.sm')) {
      tokenMap = this.tokenizeSM(content);
    } else if (filename.endsWith('.ssc')) {
      tokenMap = this.tokenizeSSC(content);
    } else if (filename.endsWith('.essc')) {
      tokenMap = this.tokenizeESSC(content);
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

  static tokenizeESSC(content: string): Record<string, any> {
    const tokens = this.tokenizeCommon(content);
    const tokenMap: Record<string, any> = {};

    tokens.forEach(token => {
      const [key, value] = token.split(/:(.+?);/);

      if (key.toLowerCase() === 'notedata') {
        const subtokens = value.split('@').map(t => t.trim()).filter(t => t.length > 0)
        const subtokenMap: Record<string, any> = {};
        subtokens.forEach(subtoken => {
          const [key, value] = subtoken.split(':');
          subtokenMap[key.toLowerCase()] = value;
        });
        tokenMap[key.toLowerCase()] = subtokenMap;
      }
      else
        tokenMap[key.toLowerCase()] = value;

    });

    return tokenMap;
  }

  static tokenizeSSC(content: string): Record<string, any> {
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
        let notes = SccReader.convertNotes(value);
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
