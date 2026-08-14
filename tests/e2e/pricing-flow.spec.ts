import { expect, test } from "@playwright/test";

test("complete pricing workflow remains accurate and isolated", async ({
  page,
  browser,
}) => {
  const nonce = Date.now();
  const email = `owner-${nonce}@example.com`;
  const password = "correct-horse-42";

  await page.goto("/signup");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your documents" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Account created");
  await expect(
    page.getByRole("link", { name: "Documents", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "New document" }).click();
  await page.getByLabel("Document title").fill("Sample pricing document");
  await page.getByLabel("Customer").fill("Acme Workshop");
  await page.getByLabel("Issue date").fill("2026-08-14");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("status").last()).toContainText("Draft created");
  await expect(page.getByLabel("Document title")).toHaveValue(
    "Sample pricing document",
  );
  await page.getByRole("button", { name: "Save document details" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "Document details saved",
  );

  const addLine = async ({
    description,
    quantity,
    unitPrice,
    discountType,
    discountValue,
    tax,
  }: {
    description: string;
    quantity: string;
    unitPrice: string;
    discountType: "None" | "Percent" | "Fixed amount";
    discountValue?: string;
    tax: string;
  }) => {
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: "Add line" }),
    });
    await form.getByLabel("Description").fill(description);
    await form.getByLabel("Qty").fill(quantity);
    await form.getByLabel("Unit price").fill(unitPrice);
    await form.getByLabel("Discount").selectOption({ label: discountType });
    if (discountValue) {
      await form
        .getByLabel(discountType === "Fixed amount" ? "Amount" : "Percent", {
          exact: true,
        })
        .fill(discountValue);
    }
    await form.getByLabel("Tax %").fill(tax);
    await form.getByRole("button", { name: "Add line" }).click();
    await expect(page.getByRole("cell", { name: description })).toBeVisible();
    await expect(page.getByRole("status").last()).toContainText(
      "Line item added",
    );
  };

  await addLine({
    description: "Widget A",
    quantity: "2",
    unitPrice: "100.00",
    discountType: "Percent",
    discountValue: "10",
    tax: "5",
  });
  await addLine({
    description: "Widget B",
    quantity: "1",
    unitPrice: "50.00",
    discountType: "None",
    tax: "5",
  });
  await addLine({
    description: "Service fee",
    quantity: "1",
    unitPrice: "200.00",
    discountType: "Fixed amount",
    discountValue: "20.00",
    tax: "0",
  });

  await expect(page.getByText("$421.50").first()).toBeVisible();
  await expect(page.getByText("$11.50").first()).toBeVisible();
  await expect(page.getByText("$40.00").first()).toBeVisible();

  const documentId = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("button", { name: "Finalize document" }).click();
  await page.getByRole("button", { name: "Yes, finalize" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "Document finalized",
  );
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Finalized amount. This record is now read-only."),
  ).toBeVisible();

  const rejectedEdit = await page.evaluate(async (id) => {
    const response = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Tampered",
        customer: "Acme Workshop",
        issueDate: "2026-08-14",
      }),
    });
    return { status: response.status, body: await response.json() };
  }, documentId);
  expect(rejectedEdit.status).toBe(409);
  expect(rejectedEdit.body.error).toContain(
    "Finalized documents cannot be edited",
  );

  await page.getByRole("link", { name: "Printable view" }).click();
  await expect(
    page.getByRole("heading", { name: "Sample pricing document" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Print document" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Widget A" })).toBeVisible();
  await page.getByRole("link", { name: "Back to document" }).click();

  await page.getByRole("button", { name: "Duplicate as draft" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "copied to a new draft",
  );
  await expect(page.getByLabel("Document title")).toHaveValue(
    "Copy of Sample pricing document",
  );
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await expect(page.getByText("$421.50").first()).toBeVisible();
  const duplicatedDocumentId = new URL(page.url()).pathname.split("/").at(-1)!;
  expect(duplicatedDocumentId).not.toBe(documentId);
  const rejectedDuplicate = await page.evaluate(async (id) => {
    const response = await fetch(`/api/documents/${id}/duplicate`, {
      method: "POST",
    });
    return { status: response.status, body: await response.json() };
  }, duplicatedDocumentId);
  expect(rejectedDuplicate.status).toBe(409);
  expect(rejectedDuplicate.body.error).toContain(
    "Only finalized documents can be duplicated",
  );

  await page.getByRole("link", { name: "Reports" }).click();
  await expect(page.getByRole("link", { name: "Reports" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByLabel("From").fill("2026-01-01");
  await page.getByLabel("To").fill("2026-12-31");
  await page.getByRole("button", { name: "Run report" }).click();
  await expect(page.getByRole("status").last()).toContainText("Report updated");
  await expect(
    page.getByRole("link", { name: "Sample pricing document", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$421.50").first()).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Open your ledger." })).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.locator(`a[href="/documents/${documentId}"]`),
  ).toBeVisible();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await otherPage.goto("/signup");
  await otherPage
    .getByLabel("Email address")
    .fill(`other-${nonce}@example.com`);
  await otherPage.getByLabel("Password").fill(password);
  await otherPage
    .getByRole("button", { name: "Create your workspace" })
    .click();
  await expect(
    otherPage.getByRole("heading", { name: "Your documents" }),
  ).toBeVisible();
  await otherPage.goto(`/documents/${documentId}`);
  await expect(otherPage.getByText("This page could not be found.")).toBeVisible();
  const hiddenDocumentStatus = await otherPage.evaluate(async (id) => {
    const response = await fetch(`/api/documents/${id}`);
    return response.status;
  }, documentId);
  expect(hiddenDocumentStatus).toBe(404);
  await otherContext.close();
});

test("API returns specific errors for invalid line and finalize input", async ({
  page,
}) => {
  const nonce = Date.now();
  await page.goto("/signup");
  await page.getByLabel("Email address").fill(`validation-${nonce}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-42");
  await page.getByRole("button", { name: "Create your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your documents" }),
  ).toBeVisible();

  const result = await page.evaluate(async () => {
    const createResponse = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Validation draft",
        customer: "Input Test",
        issueDate: "2026-08-14",
      }),
    });
    const created = await createResponse.json();
    const endpoint = `/api/documents/${created.document.id}/lines`;
    const baseLine = {
      description: "Invalid item",
      discountType: null,
      discountValue: null,
      taxRateBasis: 0,
      position: 0,
    };
    const zeroQuantityResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseLine,
        quantity: 0,
        unitPriceCents: 1_000,
      }),
    });
    const negativePriceResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseLine,
        quantity: 1,
        unitPriceCents: -1,
      }),
    });
    const finalizeResponse = await fetch(
      `/api/documents/${created.document.id}/finalize`,
      { method: "POST" },
    );

    return {
      zeroQuantity: {
        status: zeroQuantityResponse.status,
        body: await zeroQuantityResponse.json(),
      },
      negativePrice: {
        status: negativePriceResponse.status,
        body: await negativePriceResponse.json(),
      },
      finalize: {
        status: finalizeResponse.status,
        body: await finalizeResponse.json(),
      },
    };
  });

  expect(result.zeroQuantity).toMatchObject({
    status: 400,
    body: { error: "Quantity must be at least 1." },
  });
  expect(result.negativePrice).toMatchObject({
    status: 400,
    body: { error: "Unit price cannot be negative." },
  });
  expect(result.finalize).toMatchObject({
    status: 400,
    body: { error: "Add at least one valid line item before finalizing." },
  });
});
