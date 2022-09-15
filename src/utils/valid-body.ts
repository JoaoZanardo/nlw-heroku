// name: string
// yearsPlaying: number
// discord: string
// weekDays: number[]
// hourStart: string
// hourEnd: string
// useVoiceChannel: boolean

import { AdBody } from "../interfaces/create-ad.dto";
import { validBodyResponse } from "../interfaces/valid-boyd-response";

export const validBody = (body: AdBody): validBodyResponse => {
    const errors = [];
    const {
        name,
        yearsPlaying,
        discord,
        weekDays,
        hourStart,
        hourEnd,
        useVoiceChannel
    } = body;

    if (!discord || typeof discord !== 'string' || discord.length <= 0) 
    errors.push('Inválid discord');
    if (!hourEnd || typeof hourEnd !== 'string' || hourEnd.length <= 0) 
    errors.push('Inválid hour end');
    if (!hourStart || typeof hourStart !== 'string' || hourStart.length <= 0) 
    errors.push('Inválid hour start');
    if (!name || typeof name !== 'string' || name.length <= 0) 
    errors.push('Inválid name');
    if (typeof useVoiceChannel !== 'boolean' || useVoiceChannel === undefined) 
    errors.push('Inválid use voice channel');
    if (!weekDays || weekDays.length <= 0) 
    errors.push('Inválid week days');
    if (!yearsPlaying || typeof yearsPlaying !== 'number') 
    errors.push('Inválid years playing');

    if (errors.length > 0) return { status: 400, msg: errors };
    return { status: 200, msg: [] };
};