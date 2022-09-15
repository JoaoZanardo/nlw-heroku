import express from 'express';
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';
import cors from 'cors';
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors({}));


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
    } catch (e) {
        console.log(e);
    }
});

app.get('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    if (gameId.length !== 24) return res.status(400).send({
        error: 'BAD REQUEST',
        msg: 'Inválid game id'
    });

    const game = await prisma.game.findFirst({
        where: {
            id: gameId
        }
    });
    if (!game) return res.status(404).send({
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
            created_at: true,
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
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd),
            weekDays: ad.weekDays.split(',')
        };
    }));
});

app.get('/ads/:id/discord', async (req, res) => {
    const id = req.params.id;
    if (id.length !== 24) return res.status(400).send({
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

    if (!ad) return res.status(404).send({
        error: 'NOT FOUND',
        msg: 'Ad not found'
    });

    res.status(200).json(ad);
});

interface AdBody {
    name: string
    yearsPlaying: number
    discord: string
    weekDays: number[]
    hourStart: string
    hourEnd: string
    useVoiceChannel: boolean
}

app.post('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    if (gameId.length !== 24) return res.status(400).send({
        error: 'BAD REQUEST',
        msg: 'Inválid game id'
    });

    const game = await prisma.game.findFirst({
        where: {
            id: gameId
        }
    });

    if (!game) return res.status(404).send({
        error: 'NOT FOUND',
        msg: 'Game not found'
    });

    const {
        name,
        yearsPlaying,
        discord,
        weekDays,
        hourStart,
        hourEnd,
        useVoiceChannel
    } = req.body as AdBody;

    const data = {
        name,
        gameId,
        yearsPlaying: yearsPlaying,
        discord,
        weekDays: weekDays.join(','),
        hourStart: convertHourStringToMinutes(hourStart),
        hourEnd: convertHourStringToMinutes(hourEnd),
        useVoiceChannel: Boolean(useVoiceChannel)
    }

    const ad = await prisma.ad.create({ data });
    res.status(201).json(ad);
});

app.listen(process.env.PORT || 3000);