// @ts-check
import { module } from "@prisma/composer";
import cardStoreMvpService from "./service.mjs";

export default module("card-store", ({ provision }) => {
  provision(cardStoreMvpService, { id: "cardstoremvp" });
});
