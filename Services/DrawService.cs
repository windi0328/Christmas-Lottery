using System.Security.Cryptography;
using ChristmasGiftExchange.Models;

namespace ChristmasGiftExchange.Services;

public class DrawService : IDrawService
{
    public IReadOnlyList<DrawAssignment> GenerateAssignments(GiftExchangeEvent giftEvent)
    {
        var participants = giftEvent.Participants.ToList();
        if (participants.Count < 2)
        {
            throw new InvalidOperationException("至少需要兩位參與者才能抽籤。");
        }

        var shuffledReceivers = participants.ToList();
        var attempts = 0;

        do
        {
            Shuffle(shuffledReceivers);
            attempts++;
        }
        while (HasSelfMatch(participants, shuffledReceivers) && attempts < 10_000);

        if (HasSelfMatch(participants, shuffledReceivers))
        {
            throw new InvalidOperationException("無法產生有效抽籤結果，請重新嘗試。");
        }

        return participants
            .Select((giver, index) => new DrawAssignment
            {
                EventId = giftEvent.Id,
                GiverParticipantId = giver.Id,
                ReceiverParticipantId = shuffledReceivers[index].Id,
                CreatedAtUtc = DateTime.UtcNow
            })
            .ToList();
    }

    private static bool HasSelfMatch(IReadOnlyList<Participant> givers, IReadOnlyList<Participant> receivers)
        => givers.Where((t, i) => t.Id == receivers[i].Id).Any();

    private static void Shuffle<T>(IList<T> items)
    {
        for (var i = items.Count - 1; i > 0; i--)
        {
            var swapIndex = RandomNumberGenerator.GetInt32(i + 1);
            (items[i], items[swapIndex]) = (items[swapIndex], items[i]);
        }
    }
}
