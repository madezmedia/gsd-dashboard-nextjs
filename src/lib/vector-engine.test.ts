import { test } from "node:test";
import assert from "node:assert";
import { tokenize, computeTF, cosineSimilarity, calculateSemanticScore } from "./vector-engine";

test("Vector Engine - Tokenizer", () => {
  // Test lowercasing, stopword filtering, and punctuation removal
  const text = "A simple test for ACMI, including some punctuation!";
  const tokens = tokenize(text);
  
  assert.deepStrictEqual(tokens, ["simple", "test", "acmi", "including", "punctuation"]);
});

test("Vector Engine - Term Frequency (TF)", () => {
  const tokens = ["apple", "banana", "apple"];
  const tf = computeTF(tokens);
  
  assert.strictEqual(tf.get("apple"), 2 / 3);
  assert.strictEqual(tf.get("banana"), 1 / 3);
});

test("Vector Engine - Cosine Similarity", () => {
  // Exact match
  const tf1 = new Map([["apple", 0.5], ["banana", 0.5]]);
  const tf2 = new Map([["apple", 0.5], ["banana", 0.5]]);
  assert.ok(Math.abs(cosineSimilarity(tf1, tf2) - 1.0) < 1e-9);

  // Partial match
  const tf3 = new Map([["apple", 1.0]]);
  const tf4 = new Map([["apple", 0.5], ["banana", 0.5]]);
  const similarity = cosineSimilarity(tf3, tf4);
  assert.ok(similarity > 0 && similarity < 1);

  // Zero match
  const tf5 = new Map([["cherry", 1.0]]);
  assert.strictEqual(cosineSimilarity(tf3, tf5), 0);
});

test("Vector Engine - Semantic Score Boosting and Normalization", () => {
  // Check exact/high similarity boosts
  const score1 = calculateSemanticScore("Execute audit checks", "audit security checklist");
  assert.ok(score1 >= 0.5, `Expected high score for audit keywords, got ${score1}`);

  // Normalization boundaries
  const score2 = calculateSemanticScore("test test test", "test test test");
  assert.strictEqual(score2, 1.0);

  const score3 = calculateSemanticScore("completely unrelated things", "totally different topics");
  assert.strictEqual(score3, 0);
});

test("Vector Engine - Fallback Substring Matching", () => {
  // Empty tokens fallback
  const score = calculateSemanticScore("a", "about a");
  assert.strictEqual(score, 0.75);
});
