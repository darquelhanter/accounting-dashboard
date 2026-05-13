import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Local Authentication", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";

  beforeAll(async () => {
    // Ensure database is available
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available for tests");
    }
  });

  afterAll(async () => {
    // Cleanup test user
    try {
      const user = await db.getUserByEmail(testEmail);
      if (user) {
        // In a real scenario, you'd delete the user here
        // For now, we'll just leave it as the test data
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should create a local user with hashed password", async () => {
    const user = await db.createLocalUser(testEmail, testName, testPassword);

    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.name).toBe(testName);
    expect(user?.passwordHash).toBeDefined();
    expect(user?.loginMethod).toBe("local");
    expect(user?.role).toBe("user");
    
    // Verify password is hashed, not stored in plain text
    expect(user?.passwordHash).not.toBe(testPassword);
  });

  it("should not allow duplicate email registration", async () => {
    // First user already created in previous test
    try {
      await db.createLocalUser(testEmail, "Another Name", testPassword);
      expect.fail("Should have thrown an error for duplicate email");
    } catch (error: any) {
      expect(error.message).toContain("Email já cadastrado");
    }
  });

  it("should verify correct password", async () => {
    const user = await db.verifyPassword(testEmail, testPassword);

    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.name).toBe(testName);
  });

  it("should reject incorrect password", async () => {
    const user = await db.verifyPassword(testEmail, "WrongPassword");

    expect(user).toBeNull();
  });

  it("should reject login for non-existent email", async () => {
    const user = await db.verifyPassword("nonexistent@example.com", testPassword);

    expect(user).toBeNull();
  });

  it("should retrieve user by email", async () => {
    const user = await db.getUserByEmail(testEmail);

    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.name).toBe(testName);
  });

  it("should return undefined for non-existent email", async () => {
    const user = await db.getUserByEmail("nonexistent@example.com");

    expect(user).toBeUndefined();
  });

  it("should generate unique openId for each user", async () => {
    const email1 = `test-unique-1-${Date.now()}@example.com`;
    const email2 = `test-unique-2-${Date.now()}@example.com`;

    const user1 = await db.createLocalUser(email1, "User 1", "Password123");
    const user2 = await db.createLocalUser(email2, "User 2", "Password456");

    expect(user1?.openId).toBeDefined();
    expect(user2?.openId).toBeDefined();
    expect(user1?.openId).not.toBe(user2?.openId);
  });

  it("should hash password with bcrypt", async () => {
    const user = await db.getUserByEmail(testEmail);
    
    if (!user?.passwordHash) {
      expect.fail("User should have a password hash");
    }

    // Verify the hash is a valid bcrypt hash
    const isValidHash = await bcrypt.compare(testPassword, user.passwordHash);
    expect(isValidHash).toBe(true);

    // Verify wrong password doesn't match
    const isWrongPassword = await bcrypt.compare("WrongPassword", user.passwordHash);
    expect(isWrongPassword).toBe(false);
  });
});
