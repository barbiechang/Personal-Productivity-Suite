using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record UpsertVocabWordRequest(string Word, string Meaning, string? ExampleSentence);
public record UpdateVocabWordRequest(string? Word, string? Meaning, string? ExampleSentence, bool? IsLearned);

[ApiController]
[Route("api/vocab-words")]
public class VocabWordsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<VocabWord>>> GetAll() =>
        Ok(await db.VocabWords.OrderByDescending(w => w.CreatedAt).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<VocabWord>> Create(UpsertVocabWordRequest input)
    {
        var word = new VocabWord { Word = input.Word, Meaning = input.Meaning, ExampleSentence = input.ExampleSentence };
        db.VocabWords.Add(word);
        await db.SaveChangesAsync();
        return Ok(word);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VocabWord>> Update(Guid id, UpdateVocabWordRequest input)
    {
        var word = await db.VocabWords.FindAsync(id);
        if (word is null) return NotFound();

        word.Word = input.Word ?? word.Word;
        word.Meaning = input.Meaning ?? word.Meaning;
        word.ExampleSentence = input.ExampleSentence ?? word.ExampleSentence;
        word.IsLearned = input.IsLearned ?? word.IsLearned;
        await db.SaveChangesAsync();
        return Ok(word);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var word = await db.VocabWords.FindAsync(id);
        if (word is null) return NotFound();

        db.VocabWords.Remove(word);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
