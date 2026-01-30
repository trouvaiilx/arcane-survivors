/**
 * Weapon Factory
 * Creates weapon instances based on type
 */

import { WEAPONS } from '../data/config.js';
import { MagicWand } from './magicWand.js';
import { Knife } from './knife.js';
import { Garlic } from './garlic.js';
import { Whip } from './whip.js';
import { Axe } from './axe.js';
import { Cross } from './cross.js';
import { HolyWater } from './holyWater.js';
import { Lightning } from './lightning.js';
import { Fireball } from './fireball.js';
import { IceSpear } from './iceSpear.js';
import { OrbitalShield } from './orbitalShield.js';
import { RuneTracer } from './runeTracer.js';
import { Hellfire } from './hellfire.js';
import { SoulEater } from './soulEater.js';
import { VoidBeam } from './voidBeam.js';
import { ThrowingStar } from './throwingStar.js';
import { Bone } from './bone.js';
import { FireChain } from './fireChain.js';
import { ShadowDagger } from './shadowDagger.js';
import { ThunderStrike } from './thunderStrike.js';
import { ReaperScythe } from './reaperScythe.js';

export class WeaponFactory {
    static create(weaponId, player) {
        const data = WEAPONS[weaponId];
        if (!data) {
            console.error(`Unknown weapon: ${weaponId}`);
            return null;
        }
        
        switch (weaponId) {
            case 'magicWand':
                return new MagicWand(player);
            case 'knife':
                return new Knife(player);
            case 'garlic':
                return new Garlic(player);
            case 'whip':
                return new Whip(player);
            case 'axe':
                return new Axe(player);
            case 'cross':
                return new Cross(player);
            case 'holyWater':
                return new HolyWater(player);
            case 'lightning':
                return new Lightning(player);
            case 'fireball':
                return new Fireball(player);
            case 'iceSpear':
                return new IceSpear(player);
            case 'orbitalShield':
                return new OrbitalShield(player);
            case 'runeTracer':
                return new RuneTracer(player);
            case 'hellfire':
                return new Hellfire(player);
            case 'soulEater':
                return new SoulEater(player);
            case 'voidBeam':
                return new VoidBeam(player);
            case 'throwingStar':
                return new ThrowingStar(player);
            case 'bone':
                return new Bone(player);
            case 'fireChain':
                return new FireChain(player);
            case 'shadowDagger':
                return new ShadowDagger(player);
            case 'thunderStrike':
                return new ThunderStrike(player);
            case 'reaperScythe':
                return new ReaperScythe(player);
            default:
                console.error(`No implementation for weapon: ${weaponId}`);
                return null;
        }
    }
}
