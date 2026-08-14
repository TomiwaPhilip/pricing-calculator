import { expect, test } from "@playwright/test";

test("authentication and primary navigation remain usable on mobile", async ({
  page,
}) => {
  const email = `mobile-${Date.now()}@example.com`;

  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Keep the numbers honest." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("mobile-password-42");
  await page.getByRole("button", { name: "Create your workspace" }).click();

  await expect(
    page.getByRole("link", { name: "Documents", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
  await page.getByRole("link", { name: "Reports" }).click();
  await expect(
    page.getByRole("heading", { name: "The numbers, in period." }),
  ).toBeVisible();
});
