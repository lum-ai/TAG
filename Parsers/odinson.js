import Token from "./components/Token";
import Link from "./components/Link";

/**
 * Odinson parser class
 */
class CustomParser {
  /**
	 * The class constructor
	 */
  constructor() {
    // class members, all private

    /** @private */
    this.data = {
      tokens: [],
      links: [],
    };

    /** @private */
    this.parsedDocuments = {};

    /** @private */
    this.lastTokenIdx = -1;
  }

  /**
	 * Main function which parses the sentence data. This works with both an
	 * array (from which it will extract the first entry) and a single object.
	 *
	 * @public
	 * @param {Array|Object} dataObject Sentence data consisting of an array or single object
	 *
	 * @returns {Object} Object containing the parsed tokens and the links
	 */
  parse(dataObject) {
    this.reset();

    const toParse = Array.isArray(dataObject) ? dataObject[0] : dataObject;

    this.parsedDocuments[0] = this._parseSentence(toParse, Date.now());

    return this.data;
  }

  /**
	 * Reinitialize all class properties.
	 *
	 * @private
	 */
  reset() {
    this.data = {
      tokens: [],
      links: [],
    };

    this.parsedDocuments = {};
    this.lastTokenIdx = -1;
  }

  /**
	 * Method to parse and extract tokens and links from a single sentence.
	 *
	 * @param {Object} sentence Sentence object
	 * @param {String} docId The sentence document id
	 *
	 * @returns {Object} The document object that contains parsed tokens and links.
	 */
  _parseSentence(sentence, docId) {
    const thisDocument = {};
    const sentenceId = `sentence-${Date.now()}`;

    thisDocument.sentences = [];

    const createLinkInstance = (
      localDocId,
      sentenceIdLocal,
      type,
      index,
      edge,
      sentenceData,
    ) => {
      return new Link(
        `${localDocId}-${sentenceIdLocal}-${type}-${index}`,
        sentenceData[edge[0]],
        [
          {
            anchor: sentenceData[edge[1]],
            type: edge[2],
          },
        ],
        edge[2],
        type,
      );
    };

    const thisSentence = [];
    const sentenceFields = {};

    let sentenceGraph = null;

    for (let i = 0; i < sentence.fields.length; i += 1) {
      const field = sentence.fields[i];

      if (field.name !== "dependencies") {
        sentenceFields[field.name] = field.tokens;
      } else {
        sentenceGraph = field;
      }
    }

    for (let i = 0; i < sentenceFields.word.length; i += 1) {
      const thisToken = new Token(sentenceFields.word[i], i + this.lastTokenIdx + 1);

      if (sentenceFields.raw) {
        thisToken.registerLabel("raw", sentenceFields.raw[i]);
      }
      if (sentenceFields.tag) {
        thisToken.registerLabel("POS", sentenceFields.tag[i]);
      }
      if (sentenceFields.lemma) {
        thisToken.registerLabel("lemma", sentenceFields.lemma[i]);
      }
      if (sentenceFields.entity) {
        thisToken.registerLabel("entity", sentenceFields.entity[i]);
        thisToken.registerLabel("default", sentenceFields.entity[i]);
      }
      if (sentenceFields.norms) {
        thisToken.registerLabel("norm", sentenceFields.norms[i]);
      }
      if (sentenceFields.chunk) {
        thisToken.registerLabel("chunk", sentenceFields.chunk[i]);
      }

      thisSentence.push(thisToken);
      this.data.tokens.push(thisToken);
    }

    this.lastTokenIdx += sentence.numTokens;

    if (sentenceGraph) {
      for (let i = 0; i < sentenceGraph.edges.length; i += 1) {
        const edge = sentenceGraph.edges[i];

        this.data.links.push(
          createLinkInstance(docId, sentenceId, "universal-basic", i, edge, thisSentence),
        );

        this.data.links.push(
          createLinkInstance(
            docId,
            sentenceId,
            "universal-enhanced",
            i,
            edge,
            thisSentence,
          ),
        );
      }
    }

    thisDocument.sentences.push(thisSentence);

    return thisDocument;
  }
}

export default CustomParser;
