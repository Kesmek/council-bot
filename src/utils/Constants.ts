export const enum CommandActions {
  Vouch = "Vouch",
}

export enum BlacklistReasons {
  Pedophilia = "Pedophilia - Interacting with minors in a sexual fashion",
  Negligence = "Negligence - Allowing minors access to adult content",
  Blackmail = "Blackmail - Threatening to expose sensitive info in exchange" +
    " for something",
  Harassment = "Harassment/Crashing - Persistently bothering someone or" +
    " crashing them",
  Threats = "Threats - Serious threats of violence, doxxing or harrasment",
  Nuking = "Nuking - Destroying established discord servers",
  Underaged = "Underaged - Below 18 years old"
}
