"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerAnswers = void 0;
const discord_js_1 = require("discord.js");
const path = require("path");
class ListenerAnswers {
    answers;
    constructor(answers) {
        this.answers = answers;
    }
    static fromJson(json) {
        if ("answers" in json) {
            return ListenerAnswers.fromJson(json.answers);
        }
        return new ListenerAnswers(json);
    }
    toJSON() {
        return this.answers;
    }
    canSend() {
        return this.answers.length > 0;
    }
    async sendReplies(message) {
        for (const answer of this.answers) {
            await this.sendOneReply(message, answer);
        }
    }
    async sendOneReply(message, reply) {
        const row = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
            .setCustomId("delete_listen")
            .setLabel("Delete")
            .setStyle("SECONDARY"));
        if (reply.startsWith("file=")) {
            const file_alias = reply.replace("file=", "");
            const path = this.getFilePathFromAlias(file_alias);
            await message.channel
                .send({ files: [path], components: [row] })
                .catch(console.error);
        }
        else {
            await message
                .reply({
                content: reply,
                components: [row],
            })
                .catch(console.error);
        }
    }
    getFilePathFromAlias(alias) {
        const assets_folder = path.join(__dirname, "..", "..", "assets");
        switch (alias) {
            case "shock01":
                return path.join(assets_folder, "wild_hunt_shock_01.wav");
                break;
            case "shock02":
                return path.join(assets_folder, "wild_hunt_shock_01.wav");
                break;
            case "parry02":
                return path.join(assets_folder, "geralt_w3_parry_02.wav");
                break;
        }
    }
}
exports.ListenerAnswers = ListenerAnswers;
