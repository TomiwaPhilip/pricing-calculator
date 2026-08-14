import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public and authenticated screens have no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/signup");
  const signupAudit = await new AxeBuilder({ page }).analyze();
  expect(
    signupAudit.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);

  await page
    .getByLabel("Email address")
    .fill(`accessibility-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("accessible-password-42");
  await page.getByRole("button", { name: "Create your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your documents" }),
  ).toBeVisible();

  const documentsAudit = await new AxeBuilder({ page }).analyze();
  expect(
    documentsAudit.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});
