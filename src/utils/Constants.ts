export const enum CommandActions {
  ForceResolve = "Resolution Forced",
  ForceVerify = "Verification Forced",
  Invite = "Invite Generated",
  Verify = "Verification Performed",
  VerifyFail = "Verification Failed",
}

export enum BlacklistReasons {
  Blackmail = "blackmail",
  Harassment = "harassment",
  Negligence = "negligence",
  Nuking = "nuking",
  Pedophilia = "pedophilia",
  Slander = "slander",
  Threats = "threats",
  Underaged = "underage",
}

export const enum TimeUnit {
  MILLI = 1,
  SECOND = 1000 * MILLI,
  MINUTE = 60 * SECOND,
  HOUR = 60 * MINUTE,
  DAY = 24 * HOUR,
  WEEK = 7 * DAY,
}

export const BotCreator = "<@211505087653085184> (Kesmek#0001)";
