using ChristmasGiftExchange.Models;

namespace ChristmasGiftExchange.Services;

public interface IDrawService
{
    IReadOnlyList<DrawAssignment> GenerateAssignments(GiftExchangeEvent giftEvent);
}
