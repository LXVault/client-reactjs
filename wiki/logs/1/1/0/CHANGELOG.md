# 1.1.0

Released 2026-09-10.

The embedding model card now tells the truth about what a model change costs, and offers
the action that closes the gap.

## Added

* A search coverage bar on the embedding model card, showing how many of the project's
  chunks are embedded with the selected model and how many are not searchable yet.
* A button that embeds the chunks missing a vector for the current model, shown only when
  any are pending, with a note that it spends the user's own OpenRouter credits.
* A list of every model the project already holds vectors for, with its chunk count, an
  in-use badge, and a remove action for the models not in use.
* `backfillEmbeddings` and `deleteModelEmbeddings` on the API client.
* `coverage-bar`, `coverage-bar-fill`, `model-list` and `model-name` styles.

## Changed

* The card no longer says a model change "applies to newly added knowledge", which
  understated it. It now says that changing the model deletes nothing, that the previous
  model's vectors are kept, and that switching back is instant. After a switch it reports
  how many chunks are pending rather than leaving the user to discover an empty search.
* `wiki/information/overview.md` said the embedding model is set on the project detail
  screen. It is on the members screen.

## Fixed

* Switching a project's embedding model no longer silently makes its whole knowledge base
  unsearchable with no indication in the UI and no way to recover short of deleting and
  re-uploading every file.
