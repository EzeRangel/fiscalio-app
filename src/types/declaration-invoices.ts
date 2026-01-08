import { declarationInvoices } from "@/db";
import { InferResultType } from "./orm";

export type DeclarationInvoice = InferResultType<
  "declarationInvoices",
  {
    invoice: {
      with: {
        businessPartner: true;
      };
    };
  }
>;
