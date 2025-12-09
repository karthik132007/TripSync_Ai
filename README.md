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
implemented a content-based recommendation algorithm using similarity-based scoring and group aggregation heuristics

pkill -f "python.*server.py" 2>/dev/null; sleep 2 && cd /home/electron/Documents/GitHub/TripSync_Ai && "/home/electron/Documents/Random Shit/.venv/bin/python3.13" server.py