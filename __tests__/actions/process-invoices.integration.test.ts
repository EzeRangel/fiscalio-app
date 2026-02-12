import { processInvoices } from "@/actions/proccess-invoices";
import { getActiveOrganizationId } from "@/lib/session";
import { getDB } from "@/db/drizzle";
import { CFDIParser } from "@/lib/cfdi-parser";

// Mock dependencies
jest.mock("@/lib/session");
jest.mock("@/db/drizzle");
jest.mock("@/lib/cfdi-parser");
jest.mock("@ai-sdk/rsc", () => ({
  createStreamableUI: jest.fn().mockReturnValue({
    update: jest.fn(),
    done: jest.fn(),
    value: "mocked-ui",
  }),
}), { virtual: true });
jest.mock("@/data/classification-snapshots", () => ({
  suggestInvoiceClassification: jest.fn(),
}));
jest.mock("@/data/invoices", () => ({
  saveNewInvoice: jest.fn().mockResolvedValue(1),
}));
jest.mock("@/lib/utils", () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));

describe("processInvoices Integration with Integrity Checks", () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    
    // Default parser mock
    (CFDIParser.parse as jest.Mock).mockResolvedValue({});
    (CFDIParser.extractEssentials as jest.Mock).mockReturnValue({
      uuid: "TEST-UUID-123",
    });
  });

  it("should catch and report file hash duplicates", async () => {
    // Mock hash lookup to find an existing file
    mockDb.limit.mockResolvedValueOnce([{ id: 100 }]); // Hash exists

    const formData = new FormData();
    const mockFile = new File(["<xml>test</xml>"], "test.xml", { type: "text/xml" });
    formData.append("invoices", mockFile);

    // We can't easily inspect the uiStream here because it's wrapped in a closure and async
    // But we can check if it finishes without crashing and we could mock renderInvoices if we refactored
    // For now, we verify that it doesn't call saveNewInvoice if hash exists
    const result = await processInvoices(formData);
    
    // Since it's an async IIFE inside processInvoices, we need a small delay or to wait for the stream
    await new Promise(resolve => setTimeout(resolve, 100));

    const { saveNewInvoice } = require("@/data/invoices");
    expect(saveNewInvoice).not.toHaveBeenCalled();
  });

  it("should catch and report UUID duplicates", async () => {
    // Mock hash lookup to be empty, but UUID lookup to find a match
    mockDb.limit
      .mockResolvedValueOnce([]) // Hash check: OK
      .mockResolvedValueOnce([{ id: 100 }]); // UUID check: Duplicate!

    const formData = new FormData();
    const mockFile = new File(["<xml>test2</xml>"], "test2.xml", { type: "text/xml" });
    formData.append("invoices", mockFile);

    await processInvoices(formData);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const { saveNewInvoice } = require("@/data/invoices");
    expect(saveNewInvoice).not.toHaveBeenCalled();
  });

  it("should proceed if both checks pass", async () => {
    mockDb.limit.mockResolvedValue([]); // Both checks return no matches

    const formData = new FormData();
    const mockFile = new File(["<xml>new</xml>"], "new.xml", { type: "text/xml" });
    formData.append("invoices", mockFile);

    await processInvoices(formData);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const { saveNewInvoice } = require("@/data/invoices");
    expect(saveNewInvoice).toHaveBeenCalled();
  });
});
