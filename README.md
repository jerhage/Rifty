# Riftbound Companion App

This app is just for fun to explore ideas on scalable frontend architecture.

It uses a ports & adapters architecutre that separates the concerns of the domain from the implementation of said concerns. Everything the domain cares about lives
in the features directory. This ranges from defining the domain models, business logic, UI, and interfaces for dependencies that application uses.

Implementations of the dependencies live in the infrastructure directory. This allows for implementations to be swapped in/out or mixed together as needed.

Currently, all data comes from a local sqlite database. Later on I will likely need an api layer for fetching some external data such as analytics.

This application also uses zod to implement the adage of "Parse, don't validate".

I also have some crude scripts for processing raw data and transforming into seed data for the database. Currently limited by the data I can collect but will get more and/or derive some data such as
card speed (normal / action / reaction) from the raw data I already have (will require parsing the card text since the data I have doesn't treat this as a first class citizen).

I have a generated seed file in the infra layer for convenience but obviously this won't scale. For now it will suffice. I can run a script to regenerate the seed data when needed. I use a hash for versioning. The app will check if it uses the current version, and, if not, clear the relevant tables and re-seed based on the generated seed file.

## Card data and images

The catalog seed and the card art are both generated from local data and are not tracked. A fresh
clone builds them in order:

```sh
npm run fetch:cards          # card data from the riftbound API, per set, into data/api
npm run fetch:card-images    # card art into data/images, named after the riftbound ID
npm run convert:card-images  # cwebp every downloaded image, so the app only ever serves webp
npm run generate:catalog-seed
```

`npm start` serves `data/images` over the LAN on port 8787 alongside the dev server, and the app
loads card art from there. Any card whose image is missing from disk is listed in
`data/missing-images.json` when the seed is generated.

