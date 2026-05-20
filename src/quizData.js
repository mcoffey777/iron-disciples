// Iron Disciples — Quiz Question Bank
// Situational baseball scenarios for 9U players, organized by position.
// Each question: { q, options[], correct (index), explain }

export const QUIZZES = {
  P: {
    label: "Pitcher",
    icon: "⚾",
    color: "#c62828",
    desc: "Pitching situations, backing up bases, fielding your position",
    questions: [
      {
        q: "There's a runner on first base. You just pitched the ball and the batter hit a slow ground ball back to you. What's your best play?",
        options: ["Throw to first for the easy out", "Throw to second to start a double play", "Run the ball to first yourself", "Hold the ball"],
        correct: 1,
        explain: "With a runner on first and time to make the play, throwing to second gets the lead runner and can start a double play. Getting the lead runner is usually the smarter baseball play.",
      },
      {
        q: "A base hit goes to the outfield with a runner trying to score from second. Where should you, the pitcher, go?",
        options: ["Stay on the mound", "Cover home plate", "Back up the throw to home plate", "Run to second base"],
        correct: 2,
        explain: "The pitcher backs up home plate on throws coming in from the outfield. If the throw gets past the catcher, you're there to stop the ball and prevent extra bases.",
      },
      {
        q: "You're pitching and the batter bunts the ball down the third base line. Who usually calls who should field it?",
        options: ["The umpire", "The catcher", "The shortstop", "Nobody — just grab it"],
        correct: 1,
        explain: "The catcher has the whole field in front of them and calls out who should field the bunt. Always listen for your catcher's voice — communication prevents collisions and errors.",
      },
      {
        q: "After you pitch, where should your eyes and attention go?",
        options: ["To the dugout", "To the batter and the ball — you're now a fielder", "To the umpire", "Down at the mound"],
        correct: 1,
        explain: "The moment you release the pitch, you become the fifth infielder. Be ready to field a comeback ground ball or cover a base. Pitchers who don't field their position give up easy hits.",
      },
      {
        q: "Bases loaded, ground ball hit right to you. What's the smartest play for a young pitcher?",
        options: ["Throw home to force the runner", "Throw to first base", "Throw to the dugout", "Throw to third base"],
        correct: 0,
        explain: "With the bases loaded, a ground ball to the pitcher means you can throw home for the force out — the catcher just needs to touch the plate. It stops a run from scoring.",
      },
    ],
  },

  C: {
    label: "Catcher",
    icon: "🧤",
    color: "#1565c0",
    desc: "Blocking, throwing, calling plays, controlling the field",
    questions: [
      {
        q: "There's a runner on third base and a pitch gets past you to the backstop. What do you do first?",
        options: ["Argue with the umpire", "Take off your mask, find the ball fast, and cover home", "Stay crouched", "Walk to the dugout"],
        correct: 1,
        explain: "Rip off your mask so you can see, locate the ball quickly, and get back to cover the plate. The pitcher should be running to cover home too — you may need to toss them the ball.",
      },
      {
        q: "Why is the catcher considered the 'leader' of the defense?",
        options: ["They wear the most gear", "They face the whole field and can see every player", "They're always the oldest", "They bat first"],
        correct: 1,
        explain: "The catcher is the only player facing the entire field. You can see all your teammates and direct them — calling out the number of outs, where the play is, and who fields bunts.",
      },
      {
        q: "A runner is trying to steal second base. What's the most important thing for a good throw?",
        options: ["Throwing as hard as possible", "A quick release and an accurate throw", "Standing up very slowly", "Closing your eyes"],
        correct: 1,
        explain: "A quick, accurate throw beats a slow rocket every time. Catch, transfer the ball fast, and aim for the second baseman's glove. Footwork and quickness matter more than pure arm strength.",
      },
      {
        q: "There are no outs and a runner on first. Before the pitch, what should you remind your infield?",
        options: ["Nothing — they know", "Call out the number of outs and where the play is", "Tell them to swing harder", "Ask for a snack"],
        correct: 1,
        explain: "Good catchers communicate every pitch. Calling out 'No outs! Play's at second!' keeps the whole defense thinking and ready before the ball is even hit.",
      },
      {
        q: "A pitch is in the dirt with a runner on base. What's your job?",
        options: ["Let it go to the backstop", "Block it with your body to keep it in front of you", "Catch it barehanded", "Jump out of the way"],
        correct: 1,
        explain: "Drop to your knees and block the ball with your chest and body — don't try to catch it. Keeping the ball in front of you stops runners from advancing.",
      },
    ],
  },

  IF: {
    label: "Infield",
    icon: "💎",
    color: "#2e7d32",
    desc: "Ground balls, force outs, double plays, covering bases (1B, 2B, 3B, SS)",
    questions: [
      {
        q: "A ground ball is hit to you at shortstop with a runner on first base. Where's the force out?",
        options: ["Only at first base", "At second base AND first base", "Only at home", "There is no force out"],
        correct: 1,
        explain: "The runner on first MUST run to second, so there's a force at second. And the batter must run to first, so there's a force there too — that's how a double play happens.",
      },
      {
        q: "What does it mean when a base is a 'force out'?",
        options: ["You must tag the runner", "The runner must run, so you just touch the base with the ball", "The runner is automatically out", "You throw the ball at the runner"],
        correct: 1,
        explain: "On a force out, the runner is forced to advance, so the fielder only needs to touch the base while holding the ball — no tag needed. This is faster and easier than a tag.",
      },
      {
        q: "A ground ball is coming to you. What's the proper way to field it?",
        options: ["Stand straight up and reach down", "Get low, glove down in the dirt, watch the ball into your glove", "Catch it with one hand behind your back", "Turn your head away"],
        correct: 1,
        explain: "Get your body low with your glove down — it's easier to come up to a ball than to drop down. Watch the ball all the way into your glove before you throw.",
      },
      {
        q: "You're playing first base. A ground ball is hit to the shortstop. What should you do?",
        options: ["Run to the ball", "Get to first base and give the shortstop a target", "Stay where you are", "Cover second base"],
        correct: 1,
        explain: "As the first baseman, hustle to the bag and give the thrower a clear target with your glove. Stretch toward the throw once it's released to get the out as fast as possible.",
      },
      {
        q: "There's a runner on second base and a ground ball is hit to you at third. The runner stays. What's the play?",
        options: ["Throw home", "Throw to first base for the out", "Tag third base", "Throw to second"],
        correct: 1,
        explain: "If the runner on second doesn't advance, there's no force on them. The sure out is the batter running to first — make the safe, smart throw across the diamond.",
      },
      {
        q: "Why do infielders call 'I got it!' loudly on a pop fly?",
        options: ["To show off", "So teammates don't collide and everyone knows who's catching it", "Because the umpire requires it", "To distract the batter"],
        correct: 1,
        explain: "Communication prevents two players from running into each other. Whoever calls it loud and first gets the ball — everyone else backs off and backs them up.",
      },
    ],
  },

  OF: {
    label: "Outfield",
    icon: "🌳",
    color: "#c8a000",
    desc: "Fly balls, hitting cut-off men, backing up, throwing to the right base",
    questions: [
      {
        q: "You catch a fly ball in the outfield. There's a runner on third tagging up to score. Where do you throw?",
        options: ["To the cut-off man lined up toward home", "As hard as you can directly to home, no matter what", "To first base", "Hold the ball"],
        correct: 0,
        explain: "Hit the cut-off man. They're lined up between you and home and can either relay the throw or redirect it. A long airmailed throw often sails wide or short — the cut-off man keeps it accurate.",
      },
      {
        q: "A ground ball gets past the infield toward you in the outfield. What's your first job?",
        options: ["Watch it roll", "Charge the ball and field it cleanly to stop runners advancing", "Wait for an infielder", "Signal for a timeout"],
        correct: 1,
        explain: "Charge the ball under control and field it cleanly. Every second you waste lets runners take another base. Get it and get it back to the infield quickly.",
      },
      {
        q: "Why should an outfielder 'back up' the infield on a ground ball?",
        options: ["There's no reason to", "If the infielder misses or bobbles it, you're there to stop it", "To get more exercise", "To talk to the infielder"],
        correct: 1,
        explain: "If a ground ball goes through the infielder's legs or they bobble it, an outfielder backing up the play stops the ball from rolling far — preventing the runner from taking extra bases.",
      },
      {
        q: "A fly ball is hit between you and another outfielder. What should happen?",
        options: ["Both run hard and stay silent", "Whoever calls it loud and first takes it, the other backs up", "Let it drop between you", "Both jump for it"],
        correct: 1,
        explain: "Communication is everything. The first player to loudly call 'Ball! Ball! Ball!' takes it. The other player backs up the catch in case it's dropped.",
      },
      {
        q: "When catching a routine fly ball, where should you try to position your body?",
        options: ["Off to the side reaching across", "Behind the ball so you're moving forward as you catch", "Sitting down", "Facing away from the infield"],
        correct: 1,
        explain: "Get behind the ball and catch it while moving forward toward the infield. This gives you momentum to make a strong throw and a backup in case you misjudge it.",
      },
      {
        q: "It's a deep hit and a runner is rounding the bases. You don't have a play at home. Where do you throw?",
        options: ["Home anyway", "To the cut-off man or the base ahead of the runner to stop further advance", "Into the stands", "To your own dugout"],
        correct: 1,
        explain: "If there's no play at home, throw to the cut-off man or to the base ahead of the runner. Don't let other runners advance by making a hopeless throw — keep the ball in front of the play.",
      },
    ],
  },

  GEN: {
    label: "Base Running & Rules",
    icon: "🏃",
    color: "#6a1b9a",
    desc: "Base running smarts, rules, and game situations every player should know",
    questions: [
      {
        q: "There are two outs. You're the runner on first base and the batter hits the ball. When should you run?",
        options: ["Wait to see if the ball is caught", "Run hard immediately on contact", "Only run if it's a home run", "Stay at first"],
        correct: 1,
        explain: "With two outs, run hard on contact! If the ball is caught it's the third out anyway, so there's no risk. Waiting only slows you down if it's a hit.",
      },
      {
        q: "You're on second base with one out and a fly ball is hit to the outfield. What should you do?",
        options: ["Run immediately", "Stay on the base (tag up) until the ball is caught, then decide", "Run halfway and stop", "Sit down"],
        correct: 1,
        explain: "With fewer than two outs on a fly ball, tag up — keep your foot on the base until the ball is caught. Then you can advance. If you leave early and it's caught, you can be doubled off.",
      },
      {
        q: "What is a 'force out'?",
        options: ["When the runner is tagged", "When a runner must advance and the fielder touches the base", "When the batter strikes out", "When the coach forces a substitution"],
        correct: 1,
        explain: "A force out happens when a runner is forced to advance because the batter became a runner. The fielder just needs to touch the base with the ball — no tag required.",
      },
      {
        q: "You hit the ball and it's rolling fair down the line. As you run to first base, you should...",
        options: ["Slow down near the bag", "Run hard THROUGH the base, don't slow down", "Jump onto the base", "Stop and watch the ball"],
        correct: 1,
        explain: "Always run hard through first base — you can overrun it safely. Slowing down or jumping costs you precious time and can turn a hit into an out.",
      },
      {
        q: "How many outs are there in one half-inning?",
        options: ["1", "2", "3", "4"],
        correct: 2,
        explain: "Each team gets 3 outs per half-inning. Once the defense records the third out, the teams switch between batting and fielding.",
      },
      {
        q: "You're on first base. The batter hits a ground ball to the shortstop. What MUST you do?",
        options: ["Stay at first", "Run to second base — you're forced", "Run back to home", "Run to third"],
        correct: 1,
        explain: "When the batter hits the ball and runs to first, you're forced to vacate first base and advance to second. If you don't run, you can be forced out easily.",
      },
      {
        q: "What does it mean to 'tag up'?",
        options: ["Touch the next base early", "Return to and touch your base, then advance after a fly ball is caught", "Tag the fielder", "Switch places with another runner"],
        correct: 1,
        explain: "Tagging up means staying on (or returning to) your base until a fly ball is caught. Once it's caught, you're free to try to advance to the next base.",
      },
      {
        q: "Good sportsmanship means...",
        options: ["Only celebrating when you win big", "Respecting teammates, opponents, coaches, and umpires win or lose", "Arguing every call", "Ignoring the other team"],
        correct: 1,
        explain: "Being an Iron Disciple means showing respect and effort no matter the score. Hustle, encourage teammates, shake hands, and treat umpires and opponents with respect — every game.",
      },
    ],
  },
};

export const QUIZ_ORDER = ["P", "C", "IF", "OF", "GEN"];
