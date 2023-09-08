import { Message } from "discord.js";

/**
 * The TopicStore keeps in memory the different topics that were talked about
 * in the handled channel. With the keywords that were used for them.
 */
class TopicStore {
  topics: Topic[];

  /**
   * stores the last topic brought up by a user, in case the person writes
   * a single sentance in multiple messages.
   * @type {Map<Number, Topic>}
   */
  topic_by_user: Map<Number, Topic>;

  /**
   * An integer that describes how many topics are created per hour.
   * It is decreased automatically by an interval function.
   */
  topic_creation_score: number;
  constructor() {
    this.topics = [];
    this.topic_by_user = new Map();
    this.topic_creation_score = 0;

    const interval_delay = 1000 * 60 * 10; // ten minutes
    const one_hour = 1000 * 60 * 60;
    setInterval(() => {
      const decrease_amout = interval_delay / one_hour;

      this.topic_creation_score = Math.max(
        this.topic_creation_score - decrease_amout,
        0
      );
    }, interval_delay);
  }

  /**
   *
   * @param {string} message
   */
  get_best_matching_topic(message) {
    const words = message.split(" ");

    if (this.topics.length <= 0) {
      return { topic: null, score: -Infinity };
    }

    const [first_topic] = this.topics;
    const [topic, score] = this.topics
      .map((topic) => [topic, topic.get_matching_score_for_words(words)])
      .reduce(
        ([acc_topic, acc_score], [curr_topic, curr_score]) =>
          acc_score > curr_score
            ? [acc_topic, acc_score]
            : [curr_topic, curr_score],
        [first_topic, -Infinity]
      );

    return {
      topic,
      score,
    };
  }

  /**
   *
   * @param {string} message
   */
  add_topic(message) {
    const new_topic = new Topic({ original_message: message });

    this.topics.push(new_topic);

    this.topic_creation_score += 1;

    return new_topic;
  }

  set_topic_for_user(user_id: number, topic: Topic) {
    if (!user_id || !topic) {
      return;
    }

    this.topic_by_user.set(user_id, topic);
  }

  get_last_topic_for_user(user_id) {
    return this.topic_by_user.get(user_id);
  }

  delete_last_topic_for_user(user_id) {
    this.topic_by_user.delete(user_id);
  }
}

class Topic {
  origin_message: Message;
  creation_date: Date;
  keywords: Map<string, number>;
  constructor({ original_message }) {
    this.origin_message = original_message;
    this.creation_date = new Date();
    this.keywords = new Map();

    this.push_words(original_message.split(" "));
  }

  format_word(word) {
    return word.toLowerCase().replace(/[\W_0-9]/g, "");
  }

  /**
   * increase the internal counters for the given words.
   * @param {string[]} words
   */
  push_words(words) {
    for (const word of words) {
      this.push_word(word);
    }
  }

  /**
   * increase the internal counter for how often this word was used in the
   * current topic.
   * @param {string} word
   */
  push_word(word: string) {
    const formatted_word = this.format_word(word);
    const current_value = this.get_matching_score(formatted_word);

    this.keywords.set(formatted_word, current_value + 1);
  }

  /**
   *
   * @param {string[]} words
   * @returns {number} the matching score for the given words, the higher the
   * number the better. The number can go into negative values as well for
   * really out of topic series of words.
   */
  get_matching_score_for_words(words) {
    const score = words
      .map((word) => this.get_matching_score(word))
      // here, if a word was missing completely from the topic, return a negative
      // score.
      .map((score) => (score > 0 ? score : -0.1))
      .reduce((acc, curr) => acc + curr, 0);

    return score;
  }

  /**
   *
   * @param {string} word
   */
  get_matching_score(word) {
    return this.keywords.get(this.format_word(word)) || 0;
  }
}

module.exports = new TopicStore();
