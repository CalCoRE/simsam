class GenericSprite
    rules: []
    applyRules: ->
        for rule in @rules
            rule.call(this)

SpriteFactory = (className) ->
    class Sprite extends GenericSprite
        className: className

        constructor: (@instanceName) ->
            @x = @y = 0

    return Sprite

Star = SpriteFactory('Star')
Star.prototype.rules.push -> alert(
    "class: #{this.className}, instance: #{this.instanceName}")

myStar = new Star('myStar')
myStar.applyRules()

Star.prototype.rules.push -> alert(3)

myStar.applyRules()