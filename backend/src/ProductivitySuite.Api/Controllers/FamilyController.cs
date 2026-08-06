using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record UpsertFamilyMemberRequest(string Name, string? Role, DateOnly Birthday, string? Emoji, string? PhotoDataUrl);

[ApiController]
[Route("api/family")]
public class FamilyController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<FamilyMember>>> GetAll() =>
        Ok(await db.FamilyMembers.OrderBy(m => m.Name).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<FamilyMember>> Create(UpsertFamilyMemberRequest input)
    {
        var member = new FamilyMember
        {
            Name = input.Name,
            Role = input.Role,
            Birthday = input.Birthday,
            Emoji = string.IsNullOrWhiteSpace(input.Emoji) ? "👤" : input.Emoji,
            PhotoDataUrl = input.PhotoDataUrl,
        };
        db.FamilyMembers.Add(member);
        await db.SaveChangesAsync();
        return Ok(member);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FamilyMember>> Update(Guid id, UpsertFamilyMemberRequest input)
    {
        var member = await db.FamilyMembers.FindAsync(id);
        if (member is null) return NotFound();

        member.Name = input.Name;
        member.Role = input.Role;
        member.Birthday = input.Birthday;
        member.Emoji = string.IsNullOrWhiteSpace(input.Emoji) ? member.Emoji : input.Emoji;
        member.PhotoDataUrl = input.PhotoDataUrl ?? member.PhotoDataUrl;
        await db.SaveChangesAsync();
        return Ok(member);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var member = await db.FamilyMembers.FindAsync(id);
        if (member is null) return NotFound();

        db.FamilyMembers.Remove(member);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
