---
title: "The decision record is the new code review"
description: "When nobody reads every line, the thing worth reviewing carefully is the decision behind the code. How I write decision records with an AI, why they're meant to change, and how to make sure they actually get read."
pubDate: 2026-12-23
heroImage: ../../assets/blog/generated/decision-records.jpg
heroAlt: "A stack of decision records, with one marked as superseded and a pink line linking it to the newer record that replaced it"
category: leadership
tags: [ai, architecture, decision-records, documentation, engineering-process]
service: platform-engineering
cta: platform
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 5
---

In [Is waterfall back?](/blog/is-waterfall-back/) I argued that the planning worth doing now is about the shape of a
system: technology choices, how the pieces wire together, and the order things arrive in. That planning is only
useful if it's written down somewhere the next person, or the next AI thread, will find it.

That's what decision records are for. Building the platform in
[One engineer, an AI, and 890 pull requests](/blog/building-a-platform-with-claude/), I wrote 45 of them in a month.
They got more careful attention than almost any line of code.

## Review the decision, not the diff

[What comes after code review](/blog/what-comes-after-code-review/) described how little of the code I read line by
line. The decision records are where that care went instead.

One decision governs hundreds of pull requests. If it's wrong, every one of them is built on the wrong idea, and no
amount of reading diffs will catch it, because each diff faithfully does what the decision said. Review the decision
properly and the pull requests that follow mostly need checking that they match it.

## How mine get written

I make the decision. Claude writes the record. Then I review it.

The useful part is what I ask for along the way:

- **Push back on my choice.** I ask for a lot of pushback on what I've picked: the strongest arguments against it,
  and what would have to be true for it to be the wrong call.
- **Alternatives, and why other people use them.** Not just "we considered X", but where X is used elsewhere and
  what those teams get from it.

That's the review a good senior colleague would give a design, before any code exists. Writing a decision record
used to be the expensive part, which is why so few teams kept them up. With an AI doing the writing, the expensive
part is thinking about the decision, which is the part worth paying for.

A record doesn't need to be long. The headings I use are the usual ones:

- **Context:** what's forcing the decision.
- **Decision:** what we're doing.
- **Alternatives:** what else we looked at, where it's used, and why we didn't pick it.
- **Consequences:** what this makes easier, what it makes harder, and what would make us revisit it.
- **Status:** accepted, or superseded by a later record.

## Records are meant to change

The usual objection is that decision records go stale and nobody reads them. The first half of that is often true,
and that's fine as long as they get updated.

A decision record isn't a contract. It's the best call with what was known at the time. As the system grows, some
decisions turn out wrong, and some were right then and aren't now. What was right yesterday might not be right
today, and often that's only obvious in hindsight.

So when a decision changes, the record changes with it. The old one is marked as superseded and links to the new
one, which says what changed and why. Together they're both the history of how the system got here and the guidance
for what to do next.

## Point your AI at them

The second half of the objection, that nobody reads them, has a simple fix now. Tell your AI to read them.

An `AGENTS.md` or `CLAUDE.md` file at the root of a repository is read by AI coding tools at the start of every
session. A couple of lines there turn decision records from documentation into instructions:

```markdown
## Decisions

- Architecture decisions live in docs/decisions/. Read the relevant ones before changing an area they cover.
- If a change goes against an accepted decision, stop and say so. Don't work around it.
- When a decision changes, write a new record that supersedes the old one and update the old one's status.
```

Every thread then reads them, every time. That's more attention than most decision records ever got from people.

## Where to start

1. **Write down the next design argument.** The next time a decision gets made in a thread or a meeting, turn the
   outcome into a short record.
2. **Ask for pushback.** Whether from an AI or a colleague, ask for the case against and for the alternatives other
   teams use.
3. **Add the lines to your `AGENTS.md` or `CLAUDE.md`.** It takes a minute.
4. **Supersede, don't delete.** When you change your mind, write the new record and link the two.

Code is cheap now. The decisions behind it aren't, so they're what deserves the careful review.
