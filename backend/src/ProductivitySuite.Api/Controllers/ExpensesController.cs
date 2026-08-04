using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/expenses")]
public class ExpensesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Expense>>> GetAll() =>
        Ok(await db.Expenses.OrderByDescending(e => e.Date).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<Expense>> Create(Expense input)
    {
        var expense = new Expense
        {
            Description = input.Description,
            Amount = input.Amount,
            Category = input.Category,
            Date = input.Date == default ? DateTime.UtcNow : input.Date,
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = expense.Id }, expense);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var expense = await db.Expenses.FindAsync(id);
        if (expense is null) return NotFound();

        db.Expenses.Remove(expense);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
