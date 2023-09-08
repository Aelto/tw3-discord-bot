"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { HELPME_CHANNEL_IDS } = require("../constants");
const topic_store = require("./topic_store");
/**
 * This module is everything about the "helpme" handler, channels where multiple
 * conversations about various topics can happen at once. But as soon as too many
 * topics are happening at once, the bot locks the channel for a few minutes
 * and automatically sets up a few threads to help keep things organized.
 * @param {Discord.Message} message
 * @param {Discord.Client} client
 */
module.exports = async function thread_channel_handler(message, client) {
    if (!HELPME_CHANNEL_IDS.includes(message.channel.id)) {
        return;
    }
    // when the message is from the bot
    if (message.author.id === client.user.id) {
        return;
    }
    let { topic, score } = topic_store.get_best_matching_topic(message.content);
    if (!topic || score < 0) {
        console.log("no topic found or negative score");
        const result = topic_store.get_last_topic_for_user(message.author.id);
        console.log("topic for user:", result);
        if (result) {
            // check if the topic was talked about a long time ago
            const one_day = 1000 * 60 * 60 * 24;
            if (Date.now() - result.creation_date > one_day) {
                topic_store.delete_last_topic_for_user(message.author.id);
            }
            else {
                topic = result.topic;
                score = topic.get_matching_score_for_words(message.content.split(" "));
            }
        }
    }
    const is_new_topic = !Boolean(topic);
    if (is_new_topic) {
        const new_topic = topic_store.add_topic(message.content);
        message.react("♦");
        console.log("new topic", new_topic);
        topic_store.set_topic_for_user(message.author.id, new_topic);
        if (topic_store.topic_creation_score >= 2) {
            console.log("too many topics at once");
            message.react("❕");
        }
    }
    else if (score > 0) {
        topic_store.set_topic_for_user(message.author.id, topic);
    }
    console.log({ topic, score });
};
