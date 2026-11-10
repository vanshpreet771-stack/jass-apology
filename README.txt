A LITTLE SURPRISE FOR JASS 💗
=============================

A static, mobile-friendly apology website built with plain HTML, CSS and
JavaScript. No frameworks, no backend, no installs, no external files.

FILES
-----
  index.html   the page structure (all screens)
  style.css    all styling and animations
  script.js    name check, transitions, envelope, letter, choices, music
  README.txt   this file

HOW IT FLOWS
------------
  1. Name screen  ->  type "Jass" (any capitalisation) to unlock
  2. Unlocking animation  ->  "Hey, Jass 💗" welcome
  3. "Open your surprise" -> animated envelope -> tap to open
  4. The letter fades in line by line
  5. Three response buttons, each with its own reply (no pressure)
  6. Final screen: "No matter what, I hope everything gets better between us."

Music is OFF by default. Only the small "Music" button (top right) starts
the soft tones, which are generated on the device with the Web Audio API.
(On iPhones, the silent/ring switch can mute web audio.)

TRY IT ON YOUR COMPUTER
-----------------------
Unzip the folder and double-click index.html. It works straight from the
folder, no server needed.

PUBLISH ON GITHUB PAGES (free)
------------------------------
  1. Sign in at github.com and click  New repository.
     Give it a name (a not-so-obvious one is nice, e.g. "little-surprise-7").
     Choose Public (GitHub Pages is free for public repositories).
  2. On the new repository page click  "uploading an existing file".
  3. Drag in the FOUR files (index.html, style.css, script.js, README.txt)
     from inside the unzipped folder, so they sit at the top level of the
     repository, not inside another folder. Click  Commit changes.
  4. Go to  Settings -> Pages.  Under "Build and deployment" set
     Source = "Deploy from a branch", Branch = "main", Folder = "/ (root)".
     Click Save.
  5. Wait a minute or two. The page then shows your link:
        https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
  6. Send her that link.

CHANGE THE TEXT
---------------
Open script.js. Everything you may want to edit is at the very top:
  SECRET_NAME   the name that unlocks the surprise (lower case)
  UNLOCK_TEXT   the "wrong name" message
  LETTER        the letter, one line per paragraph
  REPLIES       the three replies to her choices
Headings and button labels are in index.html.

GOOD TO KNOW
------------
* The name check is a friendly gate, not a security lock. The letter is
  only added to the page after the right name is typed, but anyone who
  knows how to "view source" could still read script.js. Do not put
  anything in it that you would not want a stranger to see.
* A public GitHub repository is visible to everyone, including the code
  and the letter. The page itself asks search engines not to list it
  (noindex), but it is not private.
* There is no backend, so her choice is NOT sent to you or stored anywhere.
  She would have to tell you herself.
* Fonts are the phone's or computer's own system fonts, so nothing is
  downloaded and the look may vary slightly between devices.
* Animations switch off or simplify automatically for people who have
  "reduce motion" enabled on their device.

Made with care. 💗
