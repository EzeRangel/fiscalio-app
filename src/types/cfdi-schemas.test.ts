
import { ReceptorSchema } from "./cfdi-schemas";

describe("ReceptorSchema", () => {
  it("should validate standard UsoCFDI codes (e.g., G03)", () => {
    const validData = {
      Rfc: "AAA010101AAA",
      Nombre: "Publico en General",
      UsoCFDI: "G03",
      DomicilioFiscalReceptor: "12345",
      RegimenFiscalReceptor: "616",
    };
    expect(ReceptorSchema.safeParse(validData).success).toBe(true);
  });

  it("should validate a variety of UsoCFDI codes", () => {
    const codes = ["G01", "G03", "S01", "CP01", "CN01", "D10", "I01"];
    
    for (const code of codes) {
      const data = {
        Rfc: "AAA010101AAA",
        Nombre: "Test Name",
        UsoCFDI: code,
        DomicilioFiscalReceptor: "12345",
        RegimenFiscalReceptor: "601",
      };
      const result = ReceptorSchema.safeParse(data);
      if (!result.success) {
        console.log(`${code} failed:`, JSON.stringify(result.error.format(), null, 2));
      }
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid UsoCFDI codes", () => {
    const invalidCodes = ["G", "G1", "G123", "ABC1", "123", "CP1"];
    for (const code of invalidCodes) {
      const data = {
        Rfc: "AAA010101AAA",
        Nombre: "Test Name",
        UsoCFDI: code,
        DomicilioFiscalReceptor: "12345",
        RegimenFiscalReceptor: "601",
      };
      expect(ReceptorSchema.safeParse(data).success).toBe(false);
    }
  });
});
