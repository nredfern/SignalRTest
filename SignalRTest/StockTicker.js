// A simple templating method for replacing placeholders enclosed in curly braces.
if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

$(function () {

    var ticker = $.connection.stockTickerMini, // the generated client-side hub proxy
        up = '▲',
        down = '▼',
        $stockTable = $('#stockTable'),
        $stockTableBody = $stockTable.find('tbody'),
        rowTemplate = '<tr data-symbol="{Symbol}"><td>{Symbol}</td><td>{Price}</td><td>{DayOpen}</td><td>{Direction} {Change}</td><td>{PercentChange}</td></tr>',
        $voteTable = $('#voteTable'),
        $voteTableBody = $voteTable.find('tbody'),
        voteTemplate = '<tr data-symbol="{Name}"><td>{Name}</td><td>{Votes}</td></tr>';

    function formatStock(stock) {
        return $.extend(stock, {
            Price: stock.Price.toFixed(2),
            PercentChange: (stock.PercentChange * 100).toFixed(2) + '%',
            Direction: stock.Change === 0 ? '' : stock.Change >= 0 ? up : down
        });
    }
    
    function formatVote(vote) {
        console.log(vote);
        return $.extend(vote, {
            Name: vote.Name,
            Votes: vote.Votes
        });
    }

    function init() {
        var ctrl = document.getElementById('voteButton');
        if (ctrl) {
            ctrl.onclick = doVote;
        };

        ctrl = document.getElementById('clearButton');
        if (ctrl) {
            ctrl.onclick = clearVotes;
        }

        ticker.server.getAllStocks().done(function (stocks) {
            $stockTableBody.empty();
            $.each(stocks, function () {
                var stock = formatStock(this);
                $stockTableBody.append(rowTemplate.supplant(stock));
            });
        });

        ticker.server.getAllVotes().done(function(votes) {
            $voteTableBody.empty();
            $.each(votes,
                function() {
                    var vote = formatVote(this);
                    $voteTableBody.append(voteTemplate.supplant(vote));
                });
        });
    }

    // Add a client-side hub method that the server will call
    ticker.client.updateStockPrice = function (stock) {
        var displayStock = formatStock(stock),
            $row = $(rowTemplate.supplant(displayStock));

        $stockTableBody.find('tr[data-symbol=' + stock.Symbol + ']')
            .replaceWith($row);
    }

    // Start the connection
    $.connection.hub.start().done(init);

    function doVote() {
        var ctrl = document.getElementById("Name");
        if (ctrl) {
            ticker.server.voteFor(ctrl.value);
        }
    }

    ticker.client.updateVote = function(vote) {
        console.log(vote);
        var $row = $(voteTemplate.supplant(vote));
        console.log($row);
        var voteRow = $voteTableBody.find('tr[data-symbol=' + vote.Name + ']');
        console.log(voteRow);
        $row[0].cells[0].style.border = "5px dashed green";
        if(voteRow.length === 1)
            voteRow.replaceWith($row);
        else
            $voteTableBody.append($row);

        window.setTimeout(function() { resetBorder(vote); }, 500);
    }

    function resetBorder(vote) {
        var $row = $(voteTemplate.supplant(vote));
        var voteRow = $voteTableBody.find('tr[data-symbol=' + vote.Name + ']');
        console.log(voteRow);
        $row[0].cells[0].style.border = "1px solid black";
        if(voteRow.length === 1)
            voteRow.replaceWith($row);
    }

    function clearVotes() {
        var ctrl = document.getElementById("Name");
        if (ctrl) {
            ticker.server.clearVotes(ctrl.value);
        }
    }

    ticker.client.clearVote = function(vote) {
        //var $row = $(voteTemplate.supplant(vote));

        var voteRow = $voteTableBody.find('tr[data-symbol=' + vote.Name + ']');
        if (voteRow.length === 1) {
            voteRow.remove();
        }
    }
});