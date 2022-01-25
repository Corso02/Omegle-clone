//returns random number from 0 to maxNum
module.exports.randomFromTo = (maxNum) => {
    return Math.round(Math.random() * maxNum)
}

//returns random string with given length
module.exports.randomString = (length) => {
    const lowercaseAlphabet = [
        'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x',
        'y', 'z'
      ]
    const uppercaseAlphabet = [
        'A', 'B', 'C', 'D', 'E', 'F',
        'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R',
        'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z'
      ]
      const chars = [
        '?', '!', '@', '#',
        '$', '%', '^', '&',
        '*', '-', '_'
      ]
      const nums = [
        '0', '1', '2', '3',
        '4', '5', '6', '7',
        '8', '9'
      ]
      let resStr = ""
      let charIncluded = false

      for(let i = 0; i < length; i++){
          let decision = this.randomFromTo(3)
          while(decision === 2 && charIncluded)
            decision = this.randomFromTo(3)
          switch (decision){
                case 0: {
                    resStr = resStr.concat(lowercaseAlphabet[this.randomFromTo(lowercaseAlphabet.length - 1)])
                    break
                }
                case 1: {
                    resStr = resStr.concat(uppercaseAlphabet[this.randomFromTo(uppercaseAlphabet.length - 1)])
                    break
                }
                case 2: {
                    resStr = resStr.concat(chars[this.randomFromTo(chars.length - 1)])
                    break
                }
                case 3: {
                    resStr = resStr.concat(nums[this.randomFromTo(nums.length - 1)])
                }
          }
          if(decision === 2) 
            charIncluded = true
      }
      return resStr
}