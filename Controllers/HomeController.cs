using System.Diagnostics;
using ChristmasGiftExchange.Data;
using ChristmasGiftExchange.Models;
using ChristmasGiftExchange.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChristmasGiftExchange.Controllers;

public class HomeController : Controller
{
    private readonly ApplicationDbContext _db;

    public HomeController(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index()
    {
        var upcomingEvents = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .OrderBy(e => e.EventDate)
            .Take(3)
            .Select(e => new HomeEventCardViewModel
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location,
                ParticipantCount = e.Participants.Count,
                HasDrawn = e.Assignments.Any()
            })
            .ToListAsync();

        return View(new HomeDashboardViewModel
        {
            UpcomingEvents = upcomingEvents,
            TotalEvents = await _db.Events.CountAsync(),
            TotalParticipants = await _db.Participants.CountAsync(),
            TotalDraws = await _db.DrawAssignments.CountAsync()
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
