#!/usr/bin/env python3
"""
Generate a deterministic original background-music bed for BuildWithPankaj Reels.
No third-party samples or copyrighted recordings are used.
"""
import math
import random
import struct
import wave
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "music-bed.wav"
DURATION = float(sys.argv[2]) if len(sys.argv) > 2 else 36.0
STYLE = sys.argv[3] if len(sys.argv) > 3 else "default"
SR = 44100

if STYLE == "spark-agentic":
    BPM = 112.0
    random.seed(20260729)
    # Brighter, forward-moving tech bed for agentic/productivity content.
    CHORDS = [
        (146.83, [0, 3, 7, 10]),  # Dm7
        (174.61, [0, 4, 7, 11]),  # Fmaj7
        (130.81, [0, 4, 7, 11]),  # Cmaj7
        (196.00, [0, 2, 7, 9]),   # Gsus2/add6
    ]
else:
    BPM = 105.0
    random.seed(20260919)
    CHORDS = [
        (164.81, [0, 3, 7, 10]),   # Em7
        (130.81, [0, 4, 7, 11]),   # Cmaj7
        (196.00, [0, 4, 7, 11]),   # Gmaj7
        (146.83, [0, 2, 7, 9]),    # Dsus2/add6
    ]

BEAT = 60.0 / BPM
BAR = BEAT * 4.0

def hz(root, semitones):
    return root * (2.0 ** (semitones / 12.0))

def smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)

def env_pulse(age, length, attack=0.02, release=0.20):
    if age < 0 or age >= length:
        return 0.0
    a = smoothstep(age / max(attack, 1e-6))
    r = smoothstep((length - age) / max(release, 1e-6))
    return min(a, r)

def kick(t, beat_phase):
    # Soft electronic kick, deliberately subtle for informational content.
    age = beat_phase
    if age > 0.20:
        return 0.0
    f = 58.0 - 24.0 * (age / 0.20)
    return math.sin(2 * math.pi * f * age) * math.exp(-18 * age)

def hat(t, phase):
    # Deterministic pseudo-noise hat.
    if phase > 0.055:
        return 0.0
    n = math.sin(2*math.pi*7117*t) + 0.55*math.sin(2*math.pi*9137*t)
    return n * math.exp(-48 * phase)

with wave.open(OUT, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)

    chunk = 2048
    total = int(DURATION * SR)
    for start in range(0, total, chunk):
        frames = []
        end = min(start + chunk, total)
        for i in range(start, end):
            t = i / SR
            bar_index = int(t / BAR)
            root, intervals = CHORDS[bar_index % len(CHORDS)]
            bar_t = t - bar_index * BAR

            # Global fade and gentle mid-reel lift.
            fade_in = smoothstep(t / 0.8)
            fade_out = smoothstep((DURATION - t) / 1.2)
            lift = 0.92 + 0.08 * smoothstep((t - DURATION*0.42) / (DURATION*0.18))
            master = fade_in * fade_out * lift

            # Warm stereo pad.
            pad_l = 0.0
            pad_r = 0.0
            for idx, st in enumerate(intervals):
                f = hz(root, st)
                phase = 0.17 * idx
                pad_l += math.sin(2*math.pi*f*t + phase) + 0.18*math.sin(2*math.pi*(f*2)*t + phase)
                pad_r += math.sin(2*math.pi*f*t - phase) + 0.18*math.sin(2*math.pi*(f*2)*t - phase)
            pad_l *= 0.055
            pad_r *= 0.055

            # Eighth-note arpeggio to create movement without distracting from text.
            eighth = BEAT / 2.0
            step = int(bar_t / eighth)
            step_age = bar_t - step * eighth
            arp_st = intervals[[0, 2, 1, 3, 0, 2, 1, 2][step % 8]]
            arp_f = hz(root * 2.0, arp_st)
            arp_env = env_pulse(step_age, eighth * 0.86, 0.015, 0.18)
            arp = (math.sin(2*math.pi*arp_f*t) + 0.22*math.sin(2*math.pi*arp_f*2*t)) * 0.075 * arp_env

            # Bass on first/third beat.
            beat_idx = int(bar_t / BEAT)
            beat_phase = bar_t - beat_idx * BEAT
            bass = 0.0
            if beat_idx in (0, 2):
                bass_env = env_pulse(beat_phase, BEAT*0.85, 0.015, 0.30)
                bass = math.sin(2*math.pi*(root/2.0)*t) * 0.11 * bass_env

            # Light kick each beat, slightly stronger on 1 and 3.
            k = kick(t, beat_phase) * (0.085 if beat_idx in (0,2) else 0.052)

            # Offbeat high-frequency texture.
            off_phase = (bar_t - eighth) % BEAT
            h = hat(t, off_phase) * 0.018

            # Small stereo width on arp / hat.
            left = (pad_l + bass + k + arp*0.94 + h*0.80) * master
            right = (pad_r + bass + k + arp*1.06 + h) * master

            # Soft saturation / limiting.
            left = math.tanh(left * 1.25) * 0.78
            right = math.tanh(right * 1.25) * 0.78
            l16 = int(max(-1.0, min(1.0, left)) * 32767)
            r16 = int(max(-1.0, min(1.0, right)) * 32767)
            frames.append(struct.pack("<hh", l16, r16))
        wf.writeframes(b"".join(frames))

print(f"Generated original BuildWithPankaj music bed: {OUT} ({DURATION:.2f}s, style={STYLE}, bpm={BPM:.0f})")
