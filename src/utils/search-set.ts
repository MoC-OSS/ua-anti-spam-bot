/**
 * Search set for efficient word searches.
 */
export class SearchSet extends Set {
  search(string: string): string | null {
    /**
     * Optimizes the input string for searching by converting to lowercase, removing punctuation,
     * and normalizing white spaces.
     */
    const optimizedString = string.toLowerCase().replace(/[,.]/g, ' ').replace(/\s\s+/g, ' ').trim();
    const words = optimizedString.split(' ');

    return words.find((word) => this.has(word)) || null;
  }
}
