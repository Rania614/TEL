// Real Session 1 content from the course. The speaking task is preserved verbatim.

// The real mobile numbers are NOT kept in code (the repository is public).
// They come from the PROFILE_MOBILES environment variable (see .env.example);
// the numbers below are placeholders used only when that variable is missing.
export const PROFILES: { role: "TEACHER" | "STUDENT"; name: string; nameAr: string; username: string; mobile: string; avatar: string }[] = [
  { role: "TEACHER", name: "Rabeha", nameAr: "رابحة", username: "rabeha", mobile: "01000000000", avatar: "owl" },
  { role: "STUDENT", name: "Rania", nameAr: "رانيا", username: "rania", mobile: "01000000001", avatar: "fox" },
  { role: "STUDENT", name: "Zeinab", nameAr: "زينب", username: "zeinab", mobile: "01000000002", avatar: "deer" },
  { role: "STUDENT", name: "Mariam", nameAr: "مريم", username: "mariam", mobile: "01000000003", avatar: "cat" },
  { role: "STUDENT", name: "Fatma", nameAr: "فاطمة", username: "fatma", mobile: "01000000004", avatar: "rabbit" },
];

export const SINGER_TASK = `## Situation

Imagine that you have just become a singer, and you are preparing for your first live performance.

You have to choose a song, prepare your performance, and deal with an unexpected problem during the concert.

## Part 1 — Create Your Song

Talk about your song:

- What is the title of the song?
- What are the lyrics about?
- What kind of melody does it have?
- Is the beat slow or fast?
- Does it have a catchy tune?
- Why do you think people will sing along to it?

## Part 2 — Prepare for the Performance

Imagine you are getting ready for the concert.

Explain:

- Where will you perform live?
- Who will be in the audience?
- Will you have backing vocals?
- Do you think you have a strong singing voice?
- Will you try to hit a high note?
- How will you control your nerves?

## Part 3 — Something Goes Wrong!

During the performance:

> "The microphone suddenly stops working. The music becomes too loud, you forget part of the lyrics, and some people in the audience start singing loudly."

Explain what you would do.

Try to use:
- turn up
- turn down
- sing along
- sing out of tune
- hit the right note
- powerful vocals
- live performance

## Part 4 — Talk About Your Music

After the concert, a journalist interviews you.

Answer naturally:

- Why did you choose this song?
- What makes your song special?
- What did you think about your live performance?
- Would you release the song officially?
- Would you cover another singer's song in the future?
- Would you write your own songs?
- What kind of music would you like to make?

## Final Challenge

Give a 3–5 minute talk as if you are the singer being interviewed.

You MUST use at least:

**3 Phrasal Verbs:**
- sing along
- turn up
- turn down

**3 Idioms:**
- have a good ear for music
- music to my ears
- change my tune

**3 Collocations:**
- hit the right note
- powerful vocals
- live performance

**3 Compound Nouns:**
- music video
- songwriter
- soundtrack

**Extra challenge:**

Use these expressions naturally:
- lyrics
- melody
- beat
- catchy song
- catchy tune
- backing vocals
- hit a high note
- sing out of tune
- release a song
- cover a song

The goal is NOT to use the words one by one. The student should tell one connected story and use the expressions naturally while speaking.

---

**Task Submission Type:** Audio recording or uploaded audio file.

**Task Instructions:** Record a 3–5 minute connected speech. Students can also save a draft of their ideas before recording.`;

// [word, meaning, example, pronunciation, related]
export const VOCAB: [string, string, string, string, string[]][] = [
  ["lyrics", "The words of a song.", "I love the melody, but I can't remember the lyrics.", "/ˈlɪr.ɪks/", ["songwriter", "verse", "chorus"]],
  ["melody", "The main tune of a song — the notes you can hum.", "The melody is so simple that my little brother hums it all day.", "/ˈmel.ə.di/", ["tune", "beat"]],
  ["beat", "The regular rhythm of a piece of music.", "The beat is fast, so everyone starts dancing.", "/biːt/", ["rhythm", "tempo"]],
  ["catchy song", "A song that is easy to remember and stays in your head.", "It's such a catchy song — I've been singing it since this morning.", "/ˈkætʃ.i sɒŋ/", ["catchy tune"]],
  ["catchy tune", "A tune that is pleasant and easy to remember.", "The advert has a catchy tune that everybody knows.", "/ˈkætʃ.i tjuːn/", ["catchy song", "melody"]],
  ["backing vocals", "Singers who support the main singer, usually harmonising behind them.", "My two friends will sing backing vocals at the concert.", "/ˈbæk.ɪŋ ˈvəʊ.kəlz/", ["powerful vocals"]],
  ["music video", "A short film made to go with a song.", "They filmed the music video on the beach.", "/ˈmjuː.zɪk ˈvɪd.i.əʊ/", ["release a song"]],
  ["songwriter", "A person who writes songs (lyrics, music or both).", "She is a singer and a songwriter — she writes all her own songs.", "/ˈsɒŋˌraɪ.tər/", ["lyrics"]],
  ["soundtrack", "The music used in a film, series or game.", "The soundtrack of that film made me cry.", "/ˈsaʊnd.træk/", ["music video"]],
];

// [expression, category, meaning, example]
export const EXPRESSIONS: [string, string, string, string][] = [
  ["sing along", "PHRASAL_VERB", "To sing together with someone who is already singing, or with recorded music.", "When I started the chorus, the whole audience began to sing along."],
  ["turn up", "PHRASAL_VERB", "To increase the volume (or power) of something.", "Can you turn up the microphone? Nobody can hear me at the back."],
  ["turn down", "PHRASAL_VERB", "To reduce the volume (or power) of something.", "The music was too loud, so I asked the sound engineer to turn it down."],
  ["have a good ear for music", "IDIOM", "To be naturally good at hearing, remembering and repeating musical sounds.", "My sister has a good ear for music — she can play a song after hearing it once."],
  ["music to my ears", "IDIOM", "News or words that make you very happy to hear.", "When the audience asked for one more song, it was music to my ears."],
  ["change my tune", "IDIOM", "To change my opinion or the way I behave about something.", "I said I'd never sing live, but after the first concert I changed my tune."],
  ["hit the right note", "COLLOCATION", "To sing a note correctly; also, to say or do exactly the right thing for a situation.", "I was nervous, but I hit the right note at the end of the song."],
  ["powerful vocals", "COLLOCATION", "A strong, impressive singing voice.", "Her powerful vocals filled the whole hall without a microphone."],
  ["live performance", "COLLOCATION", "A performance in front of a real audience, not recorded.", "My first live performance was in a small café."],
  ["hit a high note", "COLLOCATION", "To sing a very high note successfully.", "I practised every day so I could hit a high note in the chorus."],
  ["sing out of tune", "COLLOCATION", "To sing notes that are not correct, so it sounds wrong.", "I couldn't hear the music, so I started to sing out of tune."],
  ["release a song", "COLLOCATION", "To make a song officially available to the public.", "We will release the song next month with a music video."],
  ["cover a song", "COLLOCATION", "To perform or record a song that another artist made first.", "In the future I would like to cover a song by my favourite singer."],
  ["music video", "COMPOUND_NOUN", "A short film made to go with a song.", "The music video has over a million views."],
  ["songwriter", "COMPOUND_NOUN", "A person who writes songs.", "As a songwriter, I write about my own life."],
  ["soundtrack", "COMPOUND_NOUN", "The music of a film, series or game.", "I'd love my song to be on a film soundtrack."],
];
