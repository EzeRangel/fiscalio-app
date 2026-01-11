// src/lib/cfdi-parser.test.ts
import fs from "fs";
import path from "path";
import { CFDIParser } from "./cfdi-parser";

describe("CFDIParser", () => {
  let xmlContent: string;

  beforeAll(() => {
    const filePath = path.join(
      process.cwd(),
      "__tests__",
      "assets",
      "cfdi-example.xml"
    );
    xmlContent = fs.readFileSync(filePath, "utf-8");
  });

  it("should parse a valid CFDI 4.0 XML", async () => {
    const cfdi = await CFDIParser.parse(xmlContent);

    expect(cfdi).toBeDefined();
    expect(cfdi.Version).toBe("4.0");
    expect(cfdi.Serie).toBe("A");
    expect(cfdi.Folio).toBe("12345");
    expect(cfdi.Emisor.Rfc).toBe("EKU9003173C9");
    expect(cfdi.Receptor.Rfc).toBe("XEXX010101000");
    expect(cfdi.Conceptos.Concepto).toBeInstanceOf(Object);
  });

  it("should extract essential data from the parsed CFDI", async () => {
    const cfdi = await CFDIParser.parse(xmlContent);
    const essentials = CFDIParser.extractEssentials(cfdi);

    expect(essentials).toBeDefined();
    expect(essentials.uuid).toBe("12345678-1234-1234-1234-123456789012");
    expect(essentials.emisorRfc).toBe("EKU9003173C9");
    expect(essentials.emisorNombre).toBe("Empresa Emisora S.A. de C.V.");
    expect(essentials.receptorRfc).toBe("XEXX010101000");
    expect(essentials.receptorNombre).toBe("Empresa Receptora S.A. de C.V.");
    expect(essentials.total).toBe(116.0);
    expect(essentials.subtotal).toBe(100.0);
    expect(essentials.conceptos).toHaveLength(1);
    expect(essentials.conceptos[0].descripcion).toBe("Producto 1");
  });

  it("should throw an error for invalid XML content", async () => {
    const invalidXml = "<xml>invalid</xml>";
    await expect(CFDIParser.parse(invalidXml)).rejects.toThrow(
      "Error al procesar XML: The document is not a CFDI"
    );
  });
});
