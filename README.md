# Riftbound Companion App

This app is just for fun to explore ideas on scalable frontend architecture.

It uses a ports & adapters architecutre that separates the concerns of the domain from the implementation of said concerns. Everything the domain cares about lives
in the features directory. This ranges from defining the domain models, business logic, UI, and interfaces for dependencies that application uses.

Implementations of the dependencies live in the infrastructure directory. This allows for implementations to be swapped in/out or mixed together as needed.

Currently, all data comes from a local sqlite database. Later on I will likely need an api layer for fetching some external data such as analytics.

This application also uses zod to implement the adage of "Parse, don't validate".

I also have some crude scripts for processing raw data and transforming into seed data for the database. Currently limited by the data I can collect but will get more and/or derive some data such as
card speed (normal / action / reaction) from the raw data I already have (will require parsing the card text since the data I have doesn't treat this as a first class citizen).

Previously i was committing a generated seed file for convenience despite it not being good practice. Now I'm hosting images myself and it no longer makes sense to keep the seed in version control. At request, I could provide a seed file that can be used to populate the DB but it would still lack the images. I prefer not to point towards external image hosts since it eats their bandwidth, so no solution for sharing this yet.

# Hosting Images

All images are just being hosted on my machine over LAN using python's http server and pointing it to my local dir.
