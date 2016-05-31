#!/bin/sh

export AUTH0_CID=BslsfnrdKMedsmr9GYkTv7ejJPReMgcE
export AUTH0_DOMAIN=beeline.au.auth0.com
export BACKEND_URL=https://beeline-server-dev.herokuapp.com
export OUTPUT_FILENAME=bundle-staging.js

webpack

