/**
 * Launch articles for the Haven Snus blog, seeded by scripts/seed-blog.ts.
 *
 * Body format (rendered by app/blog/[slug]/page.tsx): paragraphs separated by
 * a blank line, "## " for a heading, "- " for list items, **bold** inline.
 * House style: Australian English, no em dashes.
 */

export type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  /** Brands whose cans appear on the generated cover image. */
  coverBrands: string[];
  coverTint: string;
  daysAgo: number;
  content: string;
};

export const SEED_POSTS: SeedPost[] = [
  {
    slug: "what-are-nicotine-pouches",
    title: "What Are Nicotine Pouches? A Beginner's Guide",
    excerpt:
      "Small, white and tobacco-free. Here is what is inside a nicotine pouch, how to use one, and what to expect the first time.",
    category: "Guides",
    tags: ["beginners", "how to use"],
    coverBrands: ["zyn", "velo", "loop"],
    coverTint: "#e3f3ee",
    daysAgo: 21,
    content: `A nicotine pouch is a small, soft pouch that sits under your top lip and releases nicotine through your gum. There is no smoke, no vapour and no tobacco leaf. You use one, throw it away, and that is it.

If you have heard people call them "snus", that is close but not quite right. Traditional Swedish snus contains ground tobacco. The pouches we stock are tobacco-free, often called "white pouches" because of their colour.

## What is inside

Most pouches contain a short list of ingredients:

- **Plant fibre** to give the pouch its body
- **Nicotine**, either extracted from tobacco or made synthetically
- **Flavouring**, such as mint, fruit or coffee
- **Sweeteners, salt and pH adjusters** that help the flavour and the nicotine release
- **Water**, which decides whether a pouch is moist or dry

## How to use one

1. Take a pouch out of the can.
2. Tuck it between your gum and your top lip. Either side is fine.
3. You will feel a tingle or slight burn within a minute or two. That is normal, and it eases as you get used to it.
4. Leave it in for anywhere from 10 to 60 minutes. You do not need to chew or move it.
5. When you are done, put it in the lid compartment that most cans have, then in the bin.

Do not swallow the pouch, and avoid swallowing a lot of the saliva while it is in, especially when you are new to pouches. That is the most common cause of hiccups or an upset stomach.

## Your first can

Start lower than you think you need. A **Light** or **Regular** can (roughly 3 to 6mg per pouch) is the usual starting point, even for people who smoke or vape. Pouches deliver nicotine differently, and it is easier to step up than to recover from a pouch that is too strong.

If you want a full rundown of the strength scale, read our guide to choosing a strength.

## Who pouches are for

Nicotine is addictive. Pouches are for adults aged 18 and over who already use nicotine. If you do not use nicotine, please do not start. They are not suitable if you are pregnant or breastfeeding.`,
  },
  {
    slug: "how-to-choose-nicotine-pouch-strength",
    title: "How to Choose the Right Nicotine Pouch Strength",
    excerpt:
      "From Light to Extreme, here is what the six-dot scale means in milligrams, and how to find the level that suits you.",
    category: "Strengths",
    tags: ["strength", "mg", "beginners"],
    coverBrands: ["pablo", "killa", "iceberg"],
    coverTint: "#efe9f6",
    daysAgo: 17,
    content: `Strength is the first thing to get right with nicotine pouches. Flavour you can experiment with. A pouch that is too strong just makes for an unpleasant twenty minutes.

## Milligrams per pouch

Every product on Haven Snus lists its nicotine in **mg per pouch**. That is the number to compare. Some brands also print mg per gram on the can, which is useful for comparing pouches of different weights but harder to read at a glance.

## The six-dot scale

Most cans print a row of dots on the lid, and we use the same idea across the whole shop. Across our catalogue, the levels line up roughly like this:

- **Light:** up to about 3mg per pouch
- **Regular:** about 4 to 6.5mg
- **Strong:** about 7.5 to 11mg
- **Extra Strong:** about 11 to 16mg
- **Ultra Strong:** about 16 to 24mg
- **Extreme:** 25mg and above

Brands do not all draw the lines in exactly the same place, so treat the dots as a guide and the mg figure as the fact.

## Where to start

**New to nicotine pouches:** start at Light or Regular. Many people stay there.

**Switching from cigarettes or vaping:** Regular or Strong is a common starting point. A pouch delivers nicotine more slowly than a cigarette, so give it a few minutes before deciding it is too weak.

**Already using pouches:** if a can no longer feels like enough, move up one level, not three. Going from a 6mg to a 9mg pouch is a noticeable step. Going from 6mg straight to 30mg is not a good idea.

## Signs a pouch is too strong

Dizziness, nausea, hiccups, a racing heart or a strong burning feeling under the lip are all signs to take the pouch out. Next time, choose a lower strength or keep the pouch in for less time.

## Strength is not the only dial

Two pouches with the same mg can feel different. **Moist** pouches release faster than **dry** ones, and **slim** pouches tend to hit sooner than larger formats. If a can feels a little too strong, a drier or smaller pouch at the same strength can be the answer.

You can filter the whole shop by strength level from the Strengths menu.`,
  },
  {
    slug: "slim-mini-dry-nicotine-pouch-formats",
    title: "Slim, Mini or Dry? Nicotine Pouch Formats Explained",
    excerpt:
      "The shape and moisture of a pouch change how it feels and how fast it works. A quick guide to the formats on our shelves.",
    category: "Guides",
    tags: ["formats", "slim", "mini"],
    coverBrands: ["zyn", "klint", "relx"],
    coverTint: "#e8eef6",
    daysAgo: 13,
    content: `Pick up two cans with the same strength and flavour, and they can still feel quite different under the lip. The reason is usually the format: the size and shape of the pouch, and how much moisture is in it.

## Slim

Slim is by far the most common format. Of the roughly 490 products we stock, more than 420 are slim. A slim pouch is long and thin, so it sits flat along the gum and is hard to spot. Most slim pouches are moist, which means a quick, noticeable release in the first few minutes.

**Good for:** most people, and the default if you are not sure.

## Mini

Mini pouches are shorter and smaller. They are the most discreet option and tend to feel gentler, because there is less pouch material in contact with the gum. Mini pouches often come in lower strengths too.

**Good for:** new users, short sessions, or when you want something barely noticeable.

## Mini Dry

ZYN's Mini Dry range is the best-known example. These pouches have less moisture, so they release more slowly and produce less "drip". The flavour builds gradually rather than arriving all at once.

**Good for:** people who find moist pouches too intense at the start, or who want a pouch that lasts.

## Ultra-thin and specialty formats

A few brands do something different. RELX AirPouch is an ultra-thin pouch, VELO Shift is a softer comfort-shaped pouch, and KLAR uses its own bioceramic pouch material. These are worth trying if the standard slim shape does not sit well for you.

## Large

Larger pouches are rarer now. They hold more material and can feel fuller, but they are also more noticeable under the lip.

## Finding a format

Every product page lists its pouch format, and you can filter the shop by format in the sidebar. If you like a flavour but not the feel, check whether the same brand makes it in another format.`,
  },
  {
    slug: "zyn-vs-velo",
    title: "ZYN vs VELO: How the Two Biggest Pouch Brands Compare",
    excerpt:
      "Two of the best-known names in nicotine pouches, side by side: strengths, formats and flavours across our range.",
    category: "Brands",
    tags: ["zyn", "velo", "comparison"],
    coverBrands: ["zyn", "velo"],
    coverTint: "#e7f0fb",
    daysAgo: 9,
    content: `ZYN and VELO are the two brands most people have heard of, and they are also our two largest ranges, with around 60 products each. They have a lot in common, but they are not interchangeable.

## Strengths

**ZYN** covers a wide spread, from 1.5mg Mini Dry pouches up to 16.5mg slim cans. The lowest strengths make ZYN one of the easiest brands to start with.

**VELO** starts a little higher, at 4mg, and goes up to 17mg. Its middle range is dense, with 6mg, 8mg, 10mg and 14mg options, so it is easy to move up or down a small step.

## Formats

**ZYN** comes in two main formats: **Slim**, which is most of the range, and **Mini Dry**, a smaller and drier pouch that releases slowly.

**VELO** is mostly **Slim**, with a smaller **Mini** line and the softer **VELO Shift** pouch.

If you like a slow, gentle release, ZYN Mini Dry is hard to beat. If you prefer a quicker hit, both brands' slim pouches deliver.

## Flavours

Both brands lead with mint, then fruit and berry.

**ZYN** leans classic: Cool Mint, Spearmint, Menthol Ice and Black Licorice sit alongside fruitier options like Peach, Red Fruits and Cool Watermelon, plus a couple of coffee flavours such as Espressino.

**VELO** leans adventurous: alongside Freezing Peppermint, Polar Mint and Crispy Peppermint, you will find Mango Flame, Guava Passionfruit, Coconut Lime and spicier ideas like Guava Jalapeño.

## Which should you try?

- **New to pouches:** a 3mg or 6mg ZYN, or a 4mg or 6mg VELO.
- **You want mint done well:** both brands are excellent. Try ZYN Cool Mint and VELO Freezing Peppermint and see which you prefer.
- **You want something different:** VELO's tropical and spiced flavours.
- **You want a slow, discreet pouch:** ZYN Mini Dry.

Honestly, the best way to decide is to try one can of each at the same strength. Both ranges are in the shop, and you can filter by brand to compare them side by side.`,
  },
  {
    slug: "how-to-store-nicotine-pouches",
    title: "How to Store Nicotine Pouches So They Stay Fresh",
    excerpt:
      "Heat and air dry pouches out and dull the flavour. A few simple habits keep every can tasting like the first pouch.",
    category: "Guides",
    tags: ["storage", "freshness"],
    coverBrands: ["cuba", "xqs", "neafs"],
    coverTint: "#f6efe3",
    daysAgo: 5,
    content: `A fresh can of moist pouches has a soft texture and a full flavour. Leave it on a hot dashboard for a week and you will notice the difference. Here is how to keep your pouches at their best.

## Keep the lid on

Air is the enemy of moisture. Close the can properly after every pouch. If a lid is damaged, move the pouches into another empty can.

## Avoid heat

Do not leave cans in the car, in direct sun or next to a heater. In an Australian summer, a car interior can get hot enough to dry pouches out in an afternoon.

## Use the fridge for spare cans

Most brands recommend keeping unopened cans in the fridge. Cool temperatures slow down moisture loss and keep the flavour bright. Take a can out when you start it, and keep the one you are using somewhere cool and dry.

Keep cans in the main part of the fridge rather than the freezer unless the brand says otherwise.

## Use opened cans within a few weeks

Once a can is open, the pouches slowly lose moisture. They are still fine to use, but the flavour and the nicotine release will feel weaker over time. If you only use a few pouches a day, buying cans in smaller batches helps.

## Check the date

Cans carry a best-before or production date. We turn our stock over quickly, but it is still worth a glance when your order arrives.

## Keep them away from children and pets

Nicotine is toxic to children and animals, even in small amounts. Store cans out of reach, and use the lid compartment for used pouches rather than leaving them on a table or in a pocket.`,
  },
  {
    slug: "ordering-nicotine-pouches-australia-new-zealand",
    title: "Ordering Nicotine Pouches in Australia and New Zealand",
    excerpt:
      "How ordering works at Haven Snus, from checkout and payment to tracked delivery, plus what Australian customers need to know.",
    category: "News",
    tags: ["ordering", "shipping", "australia", "new zealand"],
    coverBrands: ["loop", "lumi", "clew"],
    coverTint: "#e5f1f4",
    daysAgo: 2,
    content: `We ship nicotine pouches to Australia and New Zealand. Here is how an order works from start to finish.

## 1. Build your cart

Browse by brand, strength or flavour. Prices are per can and shown in Australian dollars. If you are in New Zealand, you can switch to NZD in the header to see an estimate at today's exchange rate. Orders are always charged in AUD.

## 2. Check out

At checkout you will enter your contact details and delivery address, and confirm that you are 18 or older.

**Australian customers:** under Australian rules, importing nicotine products for personal use requires a valid prescription from an Australian doctor. You will be asked to confirm that you hold one before placing your order.

## 3. Pay

We do not take card details on the website. After you place an order, we email you payment details. Your order is packed as soon as payment is received.

## 4. Tracked delivery

Every order ships with tracking, and we email you the tracking number when it leaves. Shipping is a flat rate per country, and it is free once your order passes the free shipping threshold shown at the top of the site.

Parcels go out in plain packaging with no product branding on the outside.

## Questions?

If anything is unclear, or you want help choosing a can, send us a message through the contact page. Include your order reference (it starts with HS-) if it is about an order.`,
  },
];
