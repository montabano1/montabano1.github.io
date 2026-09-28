"""Export the real PaddleScreens tracking behind the case-study overlay video.

The overlay clip (public/media/paddlescreens-overlay.mp4, 30 s at 30 fps) was
rendered from session msxA, camera2 frames 50352-52151, which is view1 frames
50400-52199 at 60 fps (view2 = view1 - 48). All 3D data is keyed by view1
frame, in feet: x 0-30 across the enclosure, y 0-60 along it, z up.

Writes public/media/paddlescreens-rally.json:
  ball    - [x, y, z] per video frame (every 2nd view1 frame), or null in gaps
  events  - real contacts / bounces / screen hits with time and 3D position
  players - four tracked players' court positions every 1/15 s
Times are seconds from the start of the clip, so they line up with the video.

  python3 scripts/extract-rally.py
"""

import json
from pathlib import Path

HOME = Path.home()
BALL = HOME / 'score_session_20260924/msxA/bridges2/msxA.json'
EVENTS = HOME / 'score_session_20260924/msxA/physics/msxA_events.json'
PLAYERS = HOME / 'sessions/msxA/etnom_tracker.json'
OUT = Path(__file__).resolve().parent.parent / 'public/media/paddlescreens-rally.json'

START, FRAMES, FPS = 50400, 1800, 60
# Solver status codes worth drawing: measured stereo, rays, physics fill, interpolation.
DRAWN = {0, 2, 3, 6, 7}


def r(value):
    return round(float(value), 2)


ball_pos = json.loads(BALL.read_text())['pos']
ball = []
for frame in range(START, START + FRAMES, 2):
    sample = ball_pos.get(str(frame))
    ball.append([r(sample[0]), r(sample[1]), r(sample[2])] if sample and sample[3] in DRAWN else None)

events = []
for event in json.loads(EVENTS.read_text())['detected']:
    frame = event['frame']
    if START <= frame < START + FRAMES and event.get('pos'):
        kind = event['type'].replace('_', ' ')
        events.append({
            't': round((event.get('frame_exact', frame) - START) / FPS, 3),
            'type': 'screen' if 'screen' in kind else kind,
            'label': kind,
            'pos': [r(value) for value in event['pos']],
        })

samples = json.loads(PLAYERS.read_text())['samples']
players = []
for frame in range(START, START + FRAMES, 4):
    row = samples.get(str(frame))
    if not row:
        players.append(None)
        continue
    by_id = {p['id']: p for p in row}
    players.append([[r(by_id[i]['court_xy'][0]), r(by_id[i]['court_xy'][1])] if i in by_id else None for i in (1, 2, 3, 4)])

teams = {}
for row in samples.values():
    for p in row:
        teams.setdefault(p['id'], p['team'])
    if len(teams) == 4:
        break

OUT.write_text(json.dumps({
    'source': 'PaddleScreens session msxA, view1 frames 50400-52199: dual-view 3D ball solve, physics events, ReID player tracker',
    'fps': 30,
    'duration': FRAMES / FPS,
    'playerFps': 15,
    'teams': [teams.get(i) for i in (1, 2, 3, 4)],
    'ball': ball,
    'events': events,
    'players': players,
}, separators=(',', ':')))

have = sum(1 for sample in ball if sample)
print(f'wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB): {have}/{len(ball)} ball frames, '
      f'{len(events)} events, {sum(1 for p in players if p)}/{len(players)} player samples')
