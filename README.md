# TripSync_Ai

allowed = {'solo', 'friends', 'couples', 'family'}

top_30_tags = [
    'mountains', 'beach', 'nature', 'forest', 'waterfalls', 
    'lakes', 'desert', 'river', 'islands', 'caves', 
    'trekking', 'adventure', 'camping', 'safari', 'rafting', 
    'skiing', 'paragliding', 'water-sports', 'bird-watching', 'boating', 
    'heritage', 'spiritual', 'culture', 'peaceful', 'offbeat', 
    'romantic', 'history', 'luxury', 'food', 'nightlife'
]
implemented  acontent-based recommendation algorithm using similarity-based scoring and group aggregation heuristics

pkill -f "python.*server.py" 2>/dev/null; sleep 2 && cd /home/electron/Documents/GitHub/TripSync_Ai && "/home/electron/Documents/Random Shit/.venv/bin/python3.13" server.py

1. In what month you are expecting to go - [months]
2. select budget range - [slider] - [budget]
3. How many days are you planing to spend there [trip_duration]
4. how you are travelling - [best_for]
5. whats your comfort cimate -[climate]
6. select all tags that apply - [30 tags]
7. what kind of places u like -[popular] 
8. have u any favourate region [region]