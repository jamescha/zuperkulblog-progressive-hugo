# Zuperkülblog (Progressive) - Hugo Edition

A Progressive Web App built with Polymer, backed with Hugo for post management.

## Why?

Experimenting with progressive app shells and CMS. That, and decause I don't want to write posts in JSON. ;-)

## Prerequisites

Things you're going to need:

1. [Hugo](http://gohugo.io/)
2. [Python App Engine SDK](https://cloud.google.com/appengine/downloads?hl=en)

## Setup and run

```
➜ git clone git@github.com:justinribeiro/zuperkulblog-progressive-hugo.git
➜ cd zuperkulblog-progressive-hugo
➜ npm install && bower install
➜ gulp
➜ dev_appserver.py .
```

## Nuts and Bolts

1. Hugo feeds into the app shell; you write your posts normally in Hugo in `content/content/` using the same front matter you'd normally use (in this case, I used TOML).
2. The `gulp` task is what fires `hugo` to build the static JSON files from the posts you've created in Hugo.
3. Our gulp task is extended to do some heavy lifting; it takes the `*.html` that Hugo generates and renames to `*.json`.
4. Hugo itself won't generate JSON, but we can use generate our own JSON by creating the proper template layouts in `_default`.
5. Since Hugo doesn't give us access to `toJSStr`, we get around this by simply dumping our post content to safe string we can use in JSON. We'll let Polymer handle it.
6. We update `app.js` to take into account the change in routes of where the json exists. Example: `/data/art.json > /data/art/index.json`
7. We update our `article-detail.html` element to observe `article.content` and make sure it properly handles our safe html.

All in all, not too complicated really.

## Thinking outloud

* Need to deal with pulling RSS and proper sitemap.xml from Hugo into `dist/` (temporary shuffle solution for now)
* sw-precache probably shouldn't cache _every_ blog post (your blog may have many). We'd need to be smarter about how much data gets initially loaded.
* Probably should work on a PR to Hugo to have cleaner method to generate JSON directly via front matter object (was some talk on mailing list about JSON, but can't find ticket at moment for 0.16)
