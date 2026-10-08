<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep the StorySprout experience in focused browser-safe components with session-only story state; no account or remote service is needed for curated prompts.
- Define all appearance roles in src/styles.css and use shared Button variants for interactions so both themes stay consistent.
- Keep genre prompts in a shared data module so selection, surprise prompts, and writing suggestions use the same genre.
