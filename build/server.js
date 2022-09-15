"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const convert_hour_string_to_minutes_1 = require("./utils/convert-hour-string-to-minutes");
const convert_minutes_to_hour_string_1 = require("./utils/convert-minutes-to-hour-string");
const cors_1 = __importDefault(require("cors"));
const valid_body_1 = require("./utils/valid-body");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({}));
app.get('/games', async (req, res) => {
    try {
        const games = await prisma.game.findMany({
            include: {
                _count: {
                    select: {
                        Ad: true
                    }
                }
            }
        });
        res.status(200).json(games);
    }
    catch (e) {
        console.log(e);
    }
});
app.get('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    if (gameId.length !== 24)
        return res.status(400).send({
            error: 'BAD REQUEST',
            msg: 'Inválid game id'
        });
    const game = await prisma.game.findFirst({
        where: {
            id: gameId
        }
    });
    if (!game)
        return res.status(404).send({
            error: 'NOT FOUND',
            msg: 'Game not found'
        });
    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            yearsPlaying: true,
            weekDays: true,
            hourStart: true,
            hourEnd: true,
            useVoiceChannel: true,
        },
        where: {
            gameId
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    res.status(200).json(ads.map(ad => {
        return {
            ...ad,
            hourStart: (0, convert_minutes_to_hour_string_1.convertMinutesToHourString)(ad.hourStart),
            hourEnd: (0, convert_minutes_to_hour_string_1.convertMinutesToHourString)(ad.hourEnd),
            weekDays: ad.weekDays.split(',')
        };
    }));
});
app.get('/ads/:id/discord', async (req, res) => {
    const id = req.params.id;
    if (id.length !== 24)
        return res.status(400).send({
            error: 'BAD REQUEST',
            msg: 'Inválid ad id'
        });
    const ad = await prisma.ad.findFirst({
        select: {
            discord: true
        },
        where: {
            id
        }
    });
    if (!ad)
        return res.status(404).send({
            error: 'NOT FOUND',
            msg: 'Ad not found'
        });
    res.status(200).json(ad);
});
app.post('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    if (gameId.length !== 24)
        return res.status(400).send({
            error: 'BAD REQUEST',
            msg: 'Inválid game id'
        });
    const game = await prisma.game.findFirst({
        where: {
            id: gameId
        }
    });
    if (!game)
        return res.status(404).send({
            error: 'NOT FOUND',
            msg: 'Game not found'
        });
    const { status, msg } = (0, valid_body_1.validBody)(req.body);
    if (status === 400)
        return res.status(400).send({
            error: 'BAD REQUEST',
            msg
        });
    const { name, yearsPlaying, discord, weekDays, hourStart, hourEnd, useVoiceChannel } = req.body;
    const data = {
        name,
        gameId,
        yearsPlaying: yearsPlaying,
        discord,
        weekDays: weekDays.join(','),
        hourStart: (0, convert_hour_string_to_minutes_1.convertHourStringToMinutes)(hourStart),
        hourEnd: (0, convert_hour_string_to_minutes_1.convertHourStringToMinutes)(hourEnd),
        useVoiceChannel: Boolean(useVoiceChannel)
    };
    const ad = await prisma.ad.create({ data });
    res.status(201).json(ad);
});
app.listen(process.env.PORT || 3000);
