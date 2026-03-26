using ChristmasGiftExchange.Data;
using ChristmasGiftExchange.Models;
using ChristmasGiftExchange.Services;
using ChristmasGiftExchange.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChristmasGiftExchange.Controllers;

public class EventsController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly IDrawService _drawService;
    private readonly IEmailService _emailService;

    public EventsController(ApplicationDbContext db, IDrawService drawService, IEmailService emailService)
    {
        _db = db;
        _drawService = drawService;
        _emailService = emailService;
    }

    public async Task<IActionResult> Index()
    {
        var events = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .OrderBy(e => e.EventDate)
            .Select(e => new EventListItemViewModel
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                EventDate = e.EventDate,
                RegistrationDeadline = e.RegistrationDeadline,
                Location = e.Location,
                Budget = e.Budget,
                ParticipantCount = e.Participants.Count,
                HasDrawResults = e.Assignments.Any()
            })
            .ToListAsync();

        return View(events);
    }

    [HttpGet]
    public IActionResult Create()
    {
        return View(new EventFormViewModel());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(EventFormViewModel model)
    {
        if (model.RegistrationDeadline > model.EventDate)
        {
            ModelState.AddModelError(nameof(model.RegistrationDeadline), "報名截止日期不可晚於活動日期。");
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var giftEvent = new GiftExchangeEvent
        {
            Name = model.Name,
            Description = model.Description,
            EventDate = model.EventDate,
            Location = model.Location,
            RegistrationDeadline = model.RegistrationDeadline,
            Budget = model.Budget
        };

        _db.Events.Add(giftEvent);
        await _db.SaveChangesAsync();

        TempData["FlashMessage"] = "活動已建立，現在可以開始加入交換禮物成員。";
        return RedirectToAction(nameof(Details), new { id = giftEvent.Id });
    }

    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (giftEvent is null)
        {
            return NotFound();
        }

        return View(MapDetails(giftEvent));
    }

    [HttpGet]
    public async Task<IActionResult> DrawCountdown(int id)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (giftEvent is null)
        {
            return NotFound();
        }

        if (giftEvent.Assignments.Any())
        {
            TempData["FlashError"] = "這個活動已經抽過籤，若要重抽請先按下重抽按鈕。";
            return RedirectToAction(nameof(Details), new { id });
        }

        return View(new DrawCountdownViewModel
        {
            EventId = giftEvent.Id,
            EventName = giftEvent.Name,
            ExecuteUrl = Url.Action(nameof(DrawExecute), new { id }) ?? Url.Action(nameof(Details), new { id }) ?? "/"
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddParticipant(int eventId, [Bind(Prefix = "NewParticipant")] ParticipantFormViewModel model)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (giftEvent is null)
        {
            return NotFound();
        }

        if (giftEvent.Assignments.Any())
        {
            TempData["FlashError"] = "此活動已完成抽籤，請先重抽後再變更參與者。";
            return RedirectToAction(nameof(Details), new { id = eventId });
        }

        if (!ModelState.IsValid)
        {
            return View("Details", MapDetails(giftEvent, model));
        }

        _db.Participants.Add(new Participant
        {
            EventId = eventId,
            Name = model.Name,
            Email = model.Email,
            WishlistHint = model.WishlistHint
        });

        await _db.SaveChangesAsync();
        TempData["FlashMessage"] = "參與者已加入活動。";
        return RedirectToAction(nameof(Details), new { id = eventId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteParticipant(int eventId, int participantId)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (giftEvent is null)
        {
            return NotFound();
        }

        if (giftEvent.Assignments.Any())
        {
            TempData["FlashError"] = "此活動已完成抽籤，請先重抽後再刪除參與者。";
            return RedirectToAction(nameof(Details), new { id = eventId });
        }

        var participant = await _db.Participants
            .FirstOrDefaultAsync(p => p.Id == participantId && p.EventId == eventId);

        if (participant is null)
        {
            TempData["FlashError"] = "找不到要刪除的參與者。";
            return RedirectToAction(nameof(Details), new { id = eventId });
        }

        _db.Participants.Remove(participant);
        await _db.SaveChangesAsync();

        TempData["FlashMessage"] = $"已刪除參與者：{participant.Name}";
        return RedirectToAction(nameof(Details), new { id = eventId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Draw(int id)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (giftEvent is null)
        {
            return NotFound();
        }

        var result = await ExecuteDrawAsync(giftEvent);
        TempData[result.Success ? "FlashMessage" : "FlashError"] = result.Message;

        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DrawAjax(int id)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (giftEvent is null)
        {
            return NotFound();
        }

        var result = await ExecuteDrawAsync(giftEvent);
        TempData[result.Success ? "FlashMessage" : "FlashError"] = result.Message;

        return Json(new
        {
            success = result.Success,
            redirectUrl = Url.Action(nameof(Details), new { id }),
            message = result.Message
        });
    }

    [HttpGet]
    public async Task<IActionResult> DrawExecute(int id)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (giftEvent is null)
        {
            return NotFound();
        }

        var result = await ExecuteDrawAsync(giftEvent);
        TempData[result.Success ? "FlashMessage" : "FlashError"] = result.Message;

        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ResetDraw(int id)
    {
        var assignments = await _db.DrawAssignments.Where(a => a.EventId == id).ToListAsync();
        if (assignments.Count == 0)
        {
            TempData["FlashError"] = "目前沒有可重抽的抽籤結果。";
            return RedirectToAction(nameof(Details), new { id });
        }

        _db.DrawAssignments.RemoveRange(assignments);
        await _db.SaveChangesAsync();
        TempData["FlashMessage"] = "抽籤結果已清除，可以重新抽籤。";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var giftEvent = await _db.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (giftEvent is null)
        {
            TempData["FlashError"] = "找不到要刪除的活動。";
            return RedirectToAction(nameof(Index));
        }

        _db.Events.Remove(giftEvent);
        await _db.SaveChangesAsync();

        TempData["FlashMessage"] = $"活動「{giftEvent.Name}」已刪除。";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Reveal(int eventId, int? participantId = null, string? code = null)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
                .ThenInclude(a => a.Receiver)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (giftEvent is null)
        {
            return NotFound();
        }

        var model = BuildRevealViewModel(giftEvent);
        model.ParticipantId = participantId;
        model.AccessCode = code ?? string.Empty;

        if (participantId.HasValue && !string.IsNullOrWhiteSpace(code))
        {
            ApplyRevealResult(giftEvent, model);
        }

        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reveal(RevealGiftViewModel model)
    {
        var giftEvent = await _db.Events
            .Include(e => e.Participants)
            .Include(e => e.Assignments)
                .ThenInclude(a => a.Receiver)
            .FirstOrDefaultAsync(e => e.Id == model.EventId);

        if (giftEvent is null)
        {
            return NotFound();
        }

        var viewModel = BuildRevealViewModel(giftEvent);
        viewModel.ParticipantId = model.ParticipantId;
        viewModel.AccessCode = model.AccessCode.Trim().ToUpperInvariant();

        if (viewModel.ParticipantId is null)
        {
            ModelState.AddModelError(nameof(model.ParticipantId), "請先選擇你的名字。");
        }

        if (!ModelState.IsValid)
        {
            return View(viewModel);
        }

        ApplyRevealResult(giftEvent, viewModel);
        if (!viewModel.CanReveal)
        {
            ModelState.AddModelError(string.Empty, "找不到符合的通關碼，或此活動尚未建立抽籤結果。");
        }

        return View(viewModel);
    }

    private EventDetailsViewModel MapDetails(GiftExchangeEvent giftEvent, ParticipantFormViewModel? form = null)
    {
        return new EventDetailsViewModel
        {
            Id = giftEvent.Id,
            Name = giftEvent.Name,
            Description = giftEvent.Description,
            EventDate = giftEvent.EventDate,
            RegistrationDeadline = giftEvent.RegistrationDeadline,
            Location = giftEvent.Location,
            Budget = giftEvent.Budget,
            HasDrawResults = giftEvent.Assignments.Any(),
            NewParticipant = form ?? new ParticipantFormViewModel(),
            Participants = giftEvent.Participants
                .OrderBy(p => p.Name)
                .Select(p => new ParticipantSummaryViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Email = p.Email,
                    WishlistHint = p.WishlistHint,
                    AccessCode = p.AccessCode,
                    RevealUrl = Url.Action(nameof(Reveal), "Events", new { eventId = giftEvent.Id, participantId = p.Id, code = p.AccessCode }, Request.Scheme) ?? string.Empty
                })
                .ToList()
        };
    }

    private static RevealGiftViewModel BuildRevealViewModel(GiftExchangeEvent giftEvent)
    {
        return new RevealGiftViewModel
        {
            EventId = giftEvent.Id,
            EventName = giftEvent.Name,
            EventDescription = giftEvent.Description,
            EventDate = giftEvent.EventDate,
            Location = giftEvent.Location,
            Budget = giftEvent.Budget,
            Participants = giftEvent.Participants
                .OrderBy(p => p.Name)
                .Select(p => new RevealParticipantOptionViewModel
                {
                    Id = p.Id,
                    Name = p.Name
                })
                .ToList()
        };
    }

    private static void ApplyRevealResult(GiftExchangeEvent giftEvent, RevealGiftViewModel model)
    {
        if (!model.ParticipantId.HasValue)
        {
            return;
        }

        var participant = giftEvent.Participants.FirstOrDefault(p =>
            p.Id == model.ParticipantId.Value &&
            string.Equals(p.AccessCode, model.AccessCode, StringComparison.OrdinalIgnoreCase));

        if (participant is null)
        {
            return;
        }

        var assignment = giftEvent.Assignments.FirstOrDefault(a => a.GiverParticipantId == participant.Id);
        var receiver = assignment?.Receiver;

        if (receiver is null)
        {
            return;
        }

        model.VerifiedParticipantName = participant.Name;
        model.MatchedParticipantName = receiver.Name;
        model.Hint = receiver.WishlistHint;
    }

    private async Task<(bool Success, string Message)> ExecuteDrawAsync(GiftExchangeEvent giftEvent)
    {
        if (giftEvent.Assignments.Any())
        {
            return (false, "這個活動已經抽過籤，若要重抽請先按下重抽按鈕。");
        }

        try
        {
            var assignments = _drawService.GenerateAssignments(giftEvent);
            _db.DrawAssignments.AddRange(assignments);
            await _db.SaveChangesAsync();

            var participantLookup = giftEvent.Participants.ToDictionary(p => p.Id);
            foreach (var assignment in assignments)
            {
                var giver = participantLookup[assignment.GiverParticipantId];
                var receiver = participantLookup[assignment.ReceiverParticipantId];
                await _emailService.SendDrawResultAsync(giftEvent, giver, receiver);
            }

            return (true, "抽籤完成。現在每位參與者都可以用自己的通關碼揭曉結果。");
        }
        catch (InvalidOperationException ex)
        {
            return (false, ex.Message);
        }
    }
}
